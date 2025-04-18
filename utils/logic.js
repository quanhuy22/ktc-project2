// utils/logic.js

const { ObjectId } = require("mongodb");

function formatDateVN(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ✅ Ràng buộc: Thêm lượt gửi/lấy xe có tính phí sau 2 lượt miễn phí mỗi ngày
async function themLuotGuiLayXe(db, bienSoXe, loai) {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const soLuotTrongNgay = await db.collection("luot_gui_lay_xe").countDocuments({
    bienSoXe,
    thoiGian: { $gte: startOfDay, $lte: endOfDay }
  });

  const tinhPhi = soLuotTrongNgay > 2;

  const luotMoi = {
    bienSoXe,
    thoiGian: now,
    loai, // "gửi" hoặc "lấy"
    tinhPhi,
    phiPhatSinh: tinhPhi ? 3000 : 0
  };

  await db.collection("luot_gui_lay_xe").insertOne(luotMoi);

  return luotMoi;
}

// ✅ Ràng buộc: Kiểm tra sinh viên không đăng ký quá 2 xe vé tháng
async function dangKyVeThang(db, maSV, bienSoXe) {
  const maSVStr = String(maSV);

  const soXeDangKy = await db.collection("vethang").countDocuments({ maSV: maSVStr });
  if (soXeDangKy > 2) {
    throw new Error("Mỗi sinh viên chỉ được đăng ký tối đa 2 xe vé tháng");
  }

  const daTonTai = await db.collection("vethang").findOne({ maSV: maSVStr, bienSoXe });
  if (daTonTai) {
    throw new Error("Sinh viên đã đăng ký vé tháng cho biển số xe này rồi");
  }

  const veMoi = {
    maSV: maSVStr,
    bienSoXe,
    ngayDangKy: new Date(),
    donGia: 100000
  };

  await db.collection("vethang").insertOne(veMoi);
  return veMoi;
}

// ✅ Tổng chi phí mỗi SV mỗi tháng (dịch vụ + phòng)
async function thongTinChiPhiMoiThang(db) {
  const raw = await db.collection("sinhvien").aggregate([
    {
      $lookup: {
        from: "phong",
        localField: "phong",
        foreignField: "soPhong",
        as: "phongInfo"
      }
    },
    { $unwind: "$phongInfo" },
    {
      $lookup: {
        from: "sudung_dichvu",
        localField: "maSV",
        foreignField: "maSV",
        as: "dichVuDaDung"
      }
    },
    {
      $unwind: {
        path: "$dichVuDaDung",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "dichvu",
        localField: "dichVuDaDung.maDV",
        foreignField: "maDV",
        as: "thongTinDV"
      }
    },
    { $unwind: {
      path: "$thongTinDV", 
      preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        tienDichVu: {
          $multiply: ["$dichVuDaDung.soLan", "$thongTinDV.donGia"]
        },
        thang: { $month: "$dichVuDaDung.thoiGian" },
        nam: { $year: "$dichVuDaDung.thoiGian" }
      }
    },
    {
      $group: {
        _id: { maSV: "$maSV", thang: "$thang", nam: "$nam" },
        hoSo: { $first: "$$ROOT" },
        tongTienDV: { $sum: "$tienDichVu" }
      }
    },
    {
      $project: {
        _id: 0,
        maSV: "$_id.maSV",
        thang: "$_id.thang",
        nam: "$_id.nam",
        hoTen: "$hoSo.hoTen",
        lop: "$hoSo.lop",
        phong: "$hoSo.phongInfo.soPhong",
        tienPhong: "$hoSo.phongInfo.donGia",
        tongTienDV: 1,
        tongTienPhaiTra: { $add: ["$tongTienDV", "$hoSo.phongInfo.donGia"] }
      }
    }
  ]).toArray();

  return raw.map((r, i) => ({ stt: i + 1, ...r }));
}

async function thongKeDichVuTheoThoiGian(db, startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const raw = await db.collection("sudung_dichvu").aggregate([
    {
      $match: {
        thoiGian: { $gte: start, $lte: end }
      }
    },
    {
      $lookup: {
        from: "sinhvien",
        localField: "maSV",
        foreignField: "maSV",
        as: "sv"
      }
    },
    { $unwind: "$sv" },
    {
      $lookup: {
        from: "dichvu",
        localField: "maDV",
        foreignField: "maDV",
        as: "dv"
      }
    },
    { $unwind: "$dv" },
    {
      $project: {
        maSV: 1,
        tenSV: "$sv.hoTen",
        tenDV: "$dv.tenDV",
        soLan: 1,
        donGia: "$dv.donGia",
        tongGia: { $multiply: ["$soLan", "$dv.donGia"] },
        thoiGian: 1
      }
    },
    {
      $sort: { thoiGian: 1 }
    }
  ]).toArray();

  return raw.map((r, i) => ({
    stt: i + 1,
    maSV: r.maSV,
    soLan: r.soLan,
    thoiGian: formatDateVN(r.thoiGian),
    tenSV: r.tenSV,
    tenDV: r.tenDV,
    donGia: r.donGia,
    tongGia: r.tongGia
  }));
}

async function thongKeKhachTrongThang(db, startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const khach = await db.collection("khach").aggregate([
    {
      $match: {
        ngayDen: { $gte: start, $lte: end }
      }
    },
    {
      $lookup: {
        from: "sinhvien",
        localField: "maSV",
        foreignField: "maSV",
        as: "sv"
      }
    },
    { $unwind: "$sv" },
    {
      $project: {
        tenKhach: "$ten",
        cmt: "$cmt",
        ngaySinh: 1,
        maSV: 1,
        hoTenSV: "$sv.hoTen",
        ngayDen: 1
      }
    },
    {
      $sort: { ngayDen: 1 }
    }
  ]).toArray();

  return khach.map((k, i) => ({
    stt: i + 1,
    tenKhach: k.tenKhach,
    cmt: k.cmt,
    ngaySinh: formatDateVN(k.ngaySinh),
    maSVTham: k.maSV,
    hoTenSV: k.hoTenSV,
    ngayDen: formatDateVN(k.ngayDen)
  }));
}

async function doanhThuDichVuTheoThang(db) {
  const raw = await db.collection("sudung_dichvu").aggregate([
    {
      $lookup: {
        from: "dichvu",
        localField: "maDV",
        foreignField: "maDV",
        as: "dv"
      }
    },
    { $unwind: "$dv" },
    {
      $group: {
        _id: {
          maDV: "$maDV",
          tenDV: "$dv.tenDV",
          thang: { $month: "$thoiGian" },
          nam: { $year: "$thoiGian" }
        },
        doanhThu: { $sum: { $multiply: ["$soLan", "$dv.donGia"] } }
      }
    },
    {
      $project: {
        tenDV: "$_id.tenDV",
        thang: "$_id.thang",
        nam: "$_id.nam",
        doanhThu: 1,
        _id: 0
      }
    }
  ]).toArray();

  return raw.map((r, i) => ({ stt: i + 1, ...r }));
}

async function kiemTraRangBuocGuiXe(db) {
  const viPham = await db.collection("vethang").aggregate([
    {
      $group: {
        _id: "$maSV",
        soXeDangKy: { $sum: 1 }
      }
    },
    {
      $match: {
        soXeDangKy: { $gt: 2 }
      }
    },
    {
      $lookup: {
        from: "sinhvien",
        localField: "_id",
        foreignField: "maSV",
        as: "sv"
      }
    },
    { $unwind: "$sv" },
    {
      $project: {
        maSV: "$_id",
        hoTen: "$sv.hoTen",
        soXeDangKy: 1
      }
    }
  ]).toArray();

  return viPham;
}

// ✅ Thống kê lượt gửi/lấy xe trong ngày theo loại
async function thongKeLuotGuiLayXeTrongNgay(db) {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  return db.collection("luot_gui_lay_xe").aggregate([
    {
      $match: {
        thoiGian: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: "$loai",
        tongLuot: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        loai: "$_id",
        tongLuot: 1
      }
    },
    {
      $sort: { loai: 1 }
    }
  ]).toArray();
}

module.exports = {
  themLuotGuiLayXe,
  dangKyVeThang,
  thongTinChiPhiMoiThang,
  thongKeDichVuTheoThoiGian,
  thongKeKhachTrongThang,
  doanhThuDichVuTheoThang,
  kiemTraRangBuocGuiXe,
  thongKeLuotGuiLayXeTrongNgay
};
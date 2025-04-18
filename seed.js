const { connectDB, client } = require("./db");

async function seedData() {
  try {
    const db = await connectDB();

    // Xoá dữ liệu cũ
    const collections = [
      "sinhvien", "phong", "dichvu", "sudung_dichvu",
      "khach", "xegui", "vethang", "luot_gui_lay_xe"
    ];
    for (const name of collections) {
      await db.collection(name).deleteMany({});
    }
    console.log("✅ Đã xoá toàn bộ dữ liệu cũ");

    // 1. Phòng
    await db.collection("phong").insertMany([
      { soPhong: "101", loaiPhong: "Vip", donGia: 500000, soNguoiToiDa: 4 },
      { soPhong: "102", loaiPhong: "Thuong", donGia: 400000, soNguoiToiDa: 3 }
    ]);
    console.log("✅ Đã thêm dữ liệu phòng");

    // 2. Sinh viên
    await db.collection("sinhvien").insertMany([
      {
        maSV: "SV001",
        hoTen: "Quản Trường Huy",
        cmt: "123456789",
        ngaySinh: new Date("2003-05-10"),
        lop: "KTPM01",
        queQuan: "Phú Thọ",
        phong: "101"
      },
      {
        maSV: "SV002",
        hoTen: "Hán Long",
        cmt: "987654321",
        ngaySinh: new Date("2002-11-20"),
        lop: "CNTT02",
        queQuan: "Phú Thọ",
        phong: "101"
      }
    ]);
    console.log("✅ Đã thêm dữ liệu sinh viên");

    // 3. Dịch vụ
    await db.collection("dichvu").insertMany([
      { maDV: "DV001", tenDV: "Giặt là", donGia: 40000 },
      { maDV: "DV002", tenDV: "Trông xe", donGia: 100000 },
      { maDV: "DV003", tenDV: "Cho thuê xe", donGia: 50000 },
      { maDV: "DV004", tenDV: "Ăn uống", donGia: 30000 }
    ]);
    console.log("✅ Đã thêm dữ liệu dịch vụ");

    // 4. Sử dụng dịch vụ
    await db.collection("sudung_dichvu").insertMany([
      { maSV: "SV001", maDV: "DV001", soLan: 5, thoiGian: new Date("2025-04-01") },
      { maSV: "SV001", maDV: "DV004", soLan: 10, thoiGian: new Date("2025-04-03") },
      { maSV: "SV002", maDV: "DV003", soLan: 2, thoiGian: new Date("2025-04-05") }
    ]);
    console.log("✅ Đã thêm dữ liệu sử dụng dịch vụ");

    // 5. Khách đến thăm (tránh trùng CMT)
    await db.collection("khach").insertMany([
      {
        cmt: "999999999",
        ten: "Tạ Huy",
        ngaySinh: new Date("2000-01-10"),
        maSV: "SV001",
        ngayDen: new Date("2025-04-01")
      },
      {
        cmt: "18273783",
        ten: "Lê Văn Các",
        ngaySinh: new Date("1999-12-10"),
        maSV: "SV001",
        ngayDen: new Date("2025-04-02")
      }
    ]);
    console.log("✅ Đã thêm dữ liệu khách đến thăm");

    // 6. Xe tháng (xegui)
    await db.collection("xegui").insertMany([
      { bienSo: "19S1-27127", loaiXe: "xe máy" },
      { bienSo: "19S1-32621", loaiXe: "xe máy" }
    ]);
    console.log("✅ Đã thêm dữ liệu xe tháng");

    // 7. Vé tháng (test đúng ràng buộc 2 xe)
    await db.collection("vethang").insertMany([
      {
        mave:"1",
        maSV: "SV001",
        bienSoXe: "19S1-27127",
        ngayDangKy: new Date("2025-04-01"),
        donGia: 100000
      },
      {
        mave:"2",
        maSV: "SV001",
        bienSoXe: "19S1-32621",
        ngayDangKy: new Date("2025-04-01"),
        donGia: 100000
      },
      {
        mave:"3",
        maSV: "SV001",
        bienSoXe: "30B-67891",
        ngayDangKy: new Date("2025-04-01"),
        donGia: 100000
      }
    ]);
    console.log("✅ Đã thêm dữ liệu vé tháng");

    // 8. Lượt gửi/lấy xe
    await db.collection("luot_gui_lay_xe").insertMany([
      { maluot:1,
        bienSoXe: "19S1-32621",
        thoiGian: new Date("2025-04-01T08:00:00"),
        loai: "gửi",
        tinhPhi: false
      },
      {
        maluot:2,
        bienSoXe: "19S1-32621",
        thoiGian: new Date("2025-04-01T10:00:00"),
        loai: "lấy",
        tinhPhi: false
      },
      { 
        maluot:3,
        bienSoXe: "19S1-32621",
        thoiGian: new Date("2025-04-01T20:00:00"),
        loai: "gửi",
        tinhPhi: true
      }
    ]);
    console.log("✅ Đã thêm dữ liệu lượt gửi/lấy xe");

    console.log("🎉 Dữ liệu mẫu đã được thêm thành công!");
  } catch (err) {
    console.error("❌ Lỗi khi thêm dữ liệu mẫu:", err);
  } finally {
    await client.close();
  }
}

seedData();
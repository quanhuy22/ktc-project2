const { connectDB, client } = require("./db");

const {
  themLuotGuiLayXe,
  dangKyVeThang,
  thongTinChiPhiMoiThang,
  thongKeDichVuTheoThoiGian,
  thongKeKhachTrongThang,
  doanhThuDichVuTheoThang,
  kiemTraRangBuocGuiXe,
  thongKeLuotGuiLayXeTrongNgay
} = require("./utils/logic");

async function main() {
  try {
    const db = await connectDB();

    // 1️⃣ Thông tin sinh viên + tổng chi phí dịch vụ + phòng mỗi tháng
    const chiPhiSV = await thongTinChiPhiMoiThang(db);
    console.log("1️⃣ Tổng chi phí mỗi SV mỗi tháng:");
    console.table(chiPhiSV);

    // 2️⃣ Thống kê dịch vụ đã sử dụng trong khoảng thời gian cụ thể
    const startDate = new Date("2025-04-01");
    const endDate = new Date("2025-04-30");
    const dvTheoThoiGian = await thongKeDichVuTheoThoiGian(db, startDate, endDate);
    console.log("2️⃣ Thống kê dịch vụ sinh viên sử dụng trong khoảng thời gian:");
    console.table(dvTheoThoiGian);

    // 3️⃣ Thống kê khách đến chơi có thời gian cụ thể
    const khachThang = await thongKeKhachTrongThang(db, startDate, endDate);
    console.log("3️⃣ Thống kê khách đến chơi trong tháng:");
    console.table(khachThang);

    // 4️⃣ Doanh thu dịch vụ theo tháng
    const doanhThu = await doanhThuDichVuTheoThang(db);
    console.log("4️⃣ Doanh thu dịch vụ theo tháng:");
    console.table(doanhThu);

    // 5️⃣ Kiểm tra sinh viên đăng ký quá 2 xe vé tháng
    // const viPhamGuiXe = await kiemTraRangBuocGuiXe(db);
    // console.log("5️⃣ Sinh viên vi phạm (quá 2 vé tháng):");
    // console.table(viPhamGuiXe);

    //6️⃣ Ghi nhận lượt gửi xe trong ngày
    // const guiXe = await themLuotGuiLayXe(db, "19S1-32621", "gửi");
    // console.log("6️⃣ Ghi nhận lượt gửi xe:");
    // console.log(guiXe);

    // 7️⃣ Đăng ký vé tháng (nếu cần)
    // const ve = await dangKyVeThang(db, "SV001", "29A-56789");
    // console.log("7️⃣ Đăng ký vé tháng:");
    // console.log(ve);

    // 8️⃣ Thống kê lượt gửi/lấy xe trong ngày
    // const thongKeLuot = await thongKeLuotGuiLayXeTrongNgay(db);
    // console.log("8️⃣ Thống kê lượt gửi/lấy xe hôm nay:");
    // console.table(thongKeLuot);

  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  } finally {
    await client.close();
  }
}

main();
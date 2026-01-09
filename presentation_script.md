# Kịch bản Thuyết trình (Phiên bản Chi tiết)

## Slide 1: Introduction (Lời mở đầu)
**Speech**:
"Kính thưa Hội đồng bảo vệ, thưa các quý thầy cô và các bạn sinh viên.
Em tên là [Tên của bạn]. Hôm nay, em xin phép được trình bày về đồ án tốt nghiệp của mình với đề tài: **'Hệ thống Quản lý Đào tạo và Tích hợp Blockchain trong Khen thưởng Sinh viên'**.
Sau đây, em xin đi vào chi tiết nội dung báo cáo."

## Slide 2: Problem Statement & Motivation (Đặt vấn đề)
**Speech**:
"Kính thưa các thầy cô, xuất phát từ thực tế quan sát quá trình chuyển đổi số tại trường, em nhận thấy công tác quản lý đào tạo vẫn còn tồn tại một số hạn chế nhất định.
Thứ nhất, việc ghi nhận các hoạt động ngoại khóa hiện nay thường thực hiện thủ công hoặc phân tán, thiếu sự đồng bộ dữ liệu.
Thứ hai, và quan trọng nhất, là sinh viên chưa thực sự có động lực mạnh mẽ để tham gia tích cực. Điểm rèn luyện đôi khi chỉ là những con số trên giấy tờ, thiếu tính minh bạch và chưa mang lại giá trị thực tế ngay lập tức cho sinh viên."

## Slide 3: Core Project Objectives (Mục tiêu cốt lõi)
**Speech**:
"Chính vì những trăn trở đó, em đã quyết định xây dựng một hệ thống không chỉ dừng lại ở việc số hóa quy trình quản lý đào tạo truyền thống, mà còn tiên phong áp dụng công nghệ Blockchain.
Mục tiêu là tạo ra một hệ sinh thái khen thưởng: **Công bằng - Minh bạch - và Hấp dẫn**. Nơi mà mỗi nỗ lực của sinh viên đều được ghi nhận xứng đáng và chính xác."

## Slide 4: Technical Architecture (Kiến trúc kỹ thuật)
**Speech**:
"Về mặt kỹ thuật, hệ thống được xây dựng dựa trên các công nghệ hiện đại nhất hiện nay để đảm bảo hiệu năng và khả năng mở rộng:
- **Backend**: Em sử dụng **ASP.NET Core 9** kết hợp với mô hình **Clean Architecture**, giúp code rõ ràng và dễ bảo trì.
- **Frontend**: Giao diện được xây dựng bằng **Next.js 15**, mang lại trải nghiệm người dùng mượt mà và tối ưu SEO.
- **Hạ tầng**: Toàn bộ hệ thống được đóng gói và triển khai trên **Docker**, giúp việc vận hành đồng bộ trên mọi môi trường."

## Slide 5: WHY BLOCKCHAIN? (Tại sao lại là Blockchain?)
**Speech**:
"Điểm đặc biệt nhất của dự án nằm ở Kiến trúc Dữ liệu Lai (Hybrid Data Architecture).
Em kết hợp cơ sở dữ liệu **SQL Server** truyền thống để xử lý nhanh các tác vụ học vụ phức tạp, với mạng lưới **Blockchain Ethereum** để lưu trữ tài sản số.
Thiết kế này đảm bảo rằng: Dữ liệu học vụ thì xử lý nhanh, còn điểm thưởng của sinh viên thì trở thành **tài sản số thực sự** - bất biến, không thể làm giả và không thể bị sửa đổi trái phép."

## Slide 6: SMART CONTRACT DESIGN (Thiết kế Smart Contract)
**Speech**:
"Đi sâu hơn vào Blockchain, em đã xây dựng và triển khai một Smart Contract tuân thủ chuẩn **ERC-20**.
Đây không chỉ là một token thông thường, mà đã được em tích hợp thêm các cơ chế bảo mật và phân quyền chặt chẽ, đảm bảo chỉ hệ thống nhà trường mới có quyền phát hành điểm, tránh lạm phát hoặc gian lận."

## Slide 7: Relayer Pattern: Seamless UX (Giải quyết vấn đề phí Gas)
**Speech**:
"Một trong những thách thức lớn nhất khi đưa Blockchain vào môi trường giáo dục là vấn đề **Phí Gas** và sự phức tạp khi sử dụng ví điện tử. Sinh viên không thể lúc nào cũng có sẵn ETH để trả phí giao dịch.
Để giải quyết triệt để vấn đề này, em đã thiết kế và cài đặt cơ chế **Relayer (Người chuyển tiếp)** ngay trong Backend.
Khi sinh viên thực hiện giao dịch hay nhận thưởng, hệ thống sẽ tự động phát hiện, cấp một lượng gas tối thiểu hoặc thực hiện thay giao dịch đó. Điều này giúp loại bỏ hoàn toàn rào cản kỹ thuật cho người dùng cuối."

## Slide 8: Automated Reward Workflow (Quy trình thưởng tự động)
**Speech**:
"Nhờ đó, sinh viên có thể trải nghiệm công nghệ Web3 mượt mà như sử dụng các ví điện tử thông thường.
Về tính năng thực tế, hệ thống hỗ trợ điểm danh sự kiện bằng **QR Code động**. Ngay khi sinh viên quét mã check-in tại sự kiện, Smart Contract sẽ tự động kích hoạt và chuyển **VKU Coin** về ví của sinh viên ngay lập tức mà không cần chờ đợi xét duyệt thủ công."

## Slide 9: Student Shop Marketplace (Hệ sinh thái đổi thưởng)
**Speech**:
"Số VKU Coin này không chỉ để 'ngắm', mà có giá trị sử dụng thực. Sinh viên có thể dùng nó để đổi lấy các vật phẩm tại **Student Shop** - ví dụ như vé gửi xe, voucher canteen hay các quà lưu niệm của trường.
Điều này tạo nên một vòng khép kín: **Tham gia hoạt động -> Nhận Coin -> Đổi quà**, kích thích sinh viên tích cực hơn."

## Slide 10: Project Summary (Tổng kết)
**Speech**:
"Tổng kết lại, sau quá trình nghiên cứu và phát triển, đồ án đã hoàn thành được các mục tiêu đề ra:
1. Xây dựng thành công hệ thống quản lý đào tạo cơ bản.
2. Chứng minh tính khả thi của việc tích hợp Blockchain vào quy trình nghiệp vụ thực tế.
3. Hệ thống đã được triển khai và chạy ổn định trên mạng thử nghiệm **Sepolia**."

## Slide 11: Future Horizons (Hướng phát triển)
**Speech**:
"Trong tương lai, em dự kiến sẽ phát triển thêm Ứng dụng di động (Mobile App) để tiện lợi hơn cho sinh viên, đồng thời mở rộng tích hợp thanh toán với các dịch vụ khác trong trường như bãi giữ xe thông minh hay thư viện số."

## Slide 12: Closing (Lời kết)
**Speech**:
"Bài thuyết trình của em đến đây là kết thúc. Em xin chân thành cảm ơn quý thầy cô và các bạn đã lắng nghe.
Em rất mong nhận được những ý kiến đóng góp của Hội đồng để đồ án được hoàn thiện hơn ạ. Em xin cảm ơn!"

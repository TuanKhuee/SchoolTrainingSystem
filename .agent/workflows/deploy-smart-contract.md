---
description: Hướng dẫn deploy smart contract VKU lên Sepolia testnet
---

# Hướng dẫn Deploy Smart Contract VKU lên Sepolia Testnet

## Bước 1: Chuẩn bị môi trường

### 1.1. Tạo file `.env` trong thư mục `smartContract`

Tạo file `.env` với nội dung sau:

```env
# Private key của ví MetaMask (KHÔNG BAO GỜ chia sẻ với ai!)
PRIVATE_KEY=your_private_key_here

# Sepolia RPC URL (có thể dùng Alchemy hoặc Infura)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# Etherscan API Key (để verify contract)
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 1.2. Lấy Private Key từ MetaMask

1. Mở MetaMask extension
2. Click vào 3 chấm ở góc trên bên phải
3. Chọn "Account details"
4. Click "Show private key"
5. Nhập mật khẩu MetaMask
6. Copy private key (bắt đầu bằng `0x...`)

⚠️ **CẢNH BÁO**: KHÔNG BAO GIỜ commit file `.env` lên Git!

### 1.3. Lấy Sepolia RPC URL

**Cách 1: Sử dụng Alchemy (Khuyến nghị)**

1. Truy cập https://www.alchemy.com/
2. Đăng ký tài khoản miễn phí
3. Tạo một app mới:
   - Chain: Ethereum
   - Network: Sepolia
4. Copy HTTP URL từ dashboard
5. URL sẽ có dạng: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

**Cách 2: Sử dụng Infura**

1. Truy cập https://www.infura.io/
2. Đăng ký tài khoản miễn phí
3. Tạo project mới
4. Chọn Sepolia network
5. Copy endpoint URL

**Cách 3: Sử dụng public RPC (không khuyến nghị cho production)**

```
https://ethereum-sepolia-rpc.publicnode.com
```

### 1.4. Lấy Etherscan API Key

1. Truy cập https://etherscan.io/
2. Đăng ký tài khoản
3. Vào "API Keys" trong profile
4. Tạo API key mới
5. Copy API key

## Bước 2: Lấy Sepolia ETH (Test Token)

Bạn cần có Sepolia ETH để trả gas fee khi deploy contract.

**Faucet Sepolia ETH:**

1. **Alchemy Sepolia Faucet**: https://sepoliafaucet.com/
   - Cần đăng nhập bằng Alchemy account
   - Nhận 0.5 SepoliaETH/ngày

2. **Infura Sepolia Faucet**: https://www.infura.io/faucet/sepolia
   - Cần đăng nhập bằng Infura account

3. **QuickNode Faucet**: https://faucet.quicknode.com/ethereum/sepolia
   - Không cần đăng nhập
   - Nhận 0.1 SepoliaETH

4. **Google Cloud Faucet**: https://cloud.google.com/application/web3/faucet/ethereum/sepolia
   - Cần Google account

**Cách nhận:**
1. Copy địa chỉ ví MetaMask của bạn
2. Paste vào faucet
3. Hoàn thành CAPTCHA (nếu có)
4. Chờ vài phút để nhận ETH

## Bước 3: Cài đặt dependencies

Di chuyển vào thư mục smartContract:

```bash
cd d:\WorkSpace\SchoolTrainingSystem\smartContract
```

Cài đặt các package cần thiết:

```bash
npm install
```

## Bước 4: Compile Smart Contract

Compile contract để kiểm tra lỗi:

```bash
npm run compile
```

Hoặc:

```bash
npx hardhat compile
```

Nếu compile thành công, bạn sẽ thấy thông báo:
```
Compiled 1 Solidity file successfully
```

## Bước 5: Deploy lên Sepolia Testnet

Chạy lệnh deploy:

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

Kết quả sẽ hiển thị:
```
Deploying contracts with the account: 0x...
VKU Token deployed to: 0x...
Initial owner: 0x...
Initial recipient: 0x...
Total supply: 10000000000000000000000000
```

**Lưu lại địa chỉ contract** (VKU Token deployed to: 0x...) để sử dụng sau này!

## Bước 6: Verify Contract trên Etherscan (Tùy chọn nhưng khuyến nghị)

Verify contract giúp người dùng có thể đọc và tương tác với contract trên Etherscan.

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <RECIPIENT_ADDRESS> <OWNER_ADDRESS>
```

Ví dụ:
```bash
npx hardhat verify --network sepolia 0x123...abc 0x456...def 0x456...def
```

Trong đó:
- `<CONTRACT_ADDRESS>`: Địa chỉ contract vừa deploy
- `<RECIPIENT_ADDRESS>`: Địa chỉ nhận token ban đầu (thường là địa chỉ deployer)
- `<OWNER_ADDRESS>`: Địa chỉ owner của contract (thường là địa chỉ deployer)

Nếu verify thành công, bạn sẽ thấy:
```
Successfully verified contract VKU on Etherscan.
https://sepolia.etherscan.io/address/0x...#code
```

## Bước 7: Kiểm tra Contract trên Etherscan

1. Truy cập https://sepolia.etherscan.io/
2. Paste địa chỉ contract vào ô search
3. Kiểm tra:
   - **Contract**: Xem code đã verify chưa
   - **Read Contract**: Đọc thông tin (name, symbol, totalSupply, balanceOf, etc.)
   - **Write Contract**: Tương tác với contract (mint, transfer, burn, etc.)

## Bước 8: Thêm Token vào MetaMask

1. Mở MetaMask
2. Chuyển sang Sepolia network
3. Click "Import tokens"
4. Paste địa chỉ contract
5. Token symbol và decimals sẽ tự động điền
6. Click "Add Custom Token"
7. Confirm

Bây giờ bạn sẽ thấy 10,000,000 VKU trong ví!

## Troubleshooting

### Lỗi: "insufficient funds for intrinsic transaction cost"

**Nguyên nhân**: Không đủ Sepolia ETH để trả gas fee

**Giải pháp**: Lấy thêm Sepolia ETH từ faucet (xem Bước 2)

### Lỗi: "invalid private key"

**Nguyên nhân**: Private key trong `.env` không đúng format

**Giải pháp**: 
- Đảm bảo private key bắt đầu bằng `0x`
- Kiểm tra không có khoảng trắng thừa
- Private key phải có 66 ký tự (bao gồm `0x`)

### Lỗi: "network does not exist"

**Nguyên nhân**: Hardhat config không đúng

**Giải pháp**: Kiểm tra file `hardhat.config.ts` đã có cấu hình network `sepolia`

### Lỗi khi verify: "Already Verified"

**Nguyên nhân**: Contract đã được verify rồi

**Giải pháp**: Không cần verify lại, truy cập Etherscan để xem

### Lỗi: "ENOENT: no such file or directory, open '.env'"

**Nguyên nhân**: Chưa tạo file `.env`

**Giải pháp**: Tạo file `.env` trong thư mục `smartContract` (xem Bước 1.1)

## Lưu ý quan trọng

1. ✅ **LUÔN LUÔN** kiểm tra kỹ địa chỉ contract sau khi deploy
2. ✅ **LUU LẠI** địa chỉ contract vào file config hoặc document
3. ✅ **VERIFY** contract trên Etherscan để tăng tính minh bạch
4. ⚠️ **KHÔNG BAO GIỜ** commit file `.env` lên Git
5. ⚠️ **KHÔNG BAO GIỜ** chia sẻ private key với ai
6. ⚠️ **KIỂM TRA KỸ** network trước khi deploy (phải là Sepolia, không phải Mainnet!)

## Các lệnh hữu ích

```bash
# Compile contract
npm run compile

# Run tests
npm run test

# Deploy to localhost
npm run deploy:local

# Deploy to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia

# Verify contract
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <ARGS>

# Check balance
npx hardhat console --network sepolia
```

## Tài liệu tham khảo

- Hardhat Documentation: https://hardhat.org/docs
- Sepolia Faucet: https://sepoliafaucet.com/
- Etherscan Sepolia: https://sepolia.etherscan.io/
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts/

export interface VietnamBank {
  bin: string
  name: string
  shortName: string
  code: string
}

// Nguồn: danh sách ngân hàng thành viên VietQR (api.vietqr.io/v2/banks) — dùng bin để build ảnh QR
export const VIETNAM_BANKS: VietnamBank[] = [
  { bin: '970436', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam', shortName: 'Vietcombank', code: 'VCB' },
  { bin: '970415', name: 'Ngân hàng TMCP Công thương Việt Nam', shortName: 'VietinBank', code: 'ICB' },
  { bin: '970418', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', shortName: 'BIDV', code: 'BIDV' },
  { bin: '970405', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam', shortName: 'Agribank', code: 'VBA' },
  { bin: '970407', name: 'Ngân hàng TMCP Kỹ thương Việt Nam', shortName: 'Techcombank', code: 'TCB' },
  { bin: '970422', name: 'Ngân hàng TMCP Quân đội', shortName: 'MBBank', code: 'MB' },
  { bin: '970416', name: 'Ngân hàng TMCP Á Châu', shortName: 'ACB', code: 'ACB' },
  { bin: '970432', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', shortName: 'VPBank', code: 'VPB' },
  { bin: '970423', name: 'Ngân hàng TMCP Tiên Phong', shortName: 'TPBank', code: 'TPB' },
  { bin: '970403', name: 'Ngân hàng TMCP Sài Gòn Thương Tín', shortName: 'Sacombank', code: 'STB' },
  { bin: '970437', name: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh', shortName: 'HDBank', code: 'HDB' },
  { bin: '970448', name: 'Ngân hàng TMCP Phương Đông', shortName: 'OCB', code: 'OCB' },
  { bin: '970429', name: 'Ngân hàng TMCP Sài Gòn', shortName: 'SCB', code: 'SCB' },
  { bin: '970441', name: 'Ngân hàng TMCP Quốc tế Việt Nam', shortName: 'VIB', code: 'VIB' },
  { bin: '970443', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội', shortName: 'SHB', code: 'SHB' },
  { bin: '970431', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam', shortName: 'Eximbank', code: 'EIB' },
  { bin: '970426', name: 'Ngân hàng TMCP Hàng Hải Việt Nam', shortName: 'MSB', code: 'MSB' },
  { bin: '970454', name: 'Ngân hàng TMCP Bản Việt', shortName: 'VietCapitalBank', code: 'VCCB' },
  { bin: '970400', name: 'Ngân hàng TMCP Sài Gòn Công Thương', shortName: 'SaigonBank', code: 'SGICB' },
  { bin: '970409', name: 'Ngân hàng TMCP Bắc Á', shortName: 'BacABank', code: 'BAB' },
  { bin: '970412', name: 'Ngân hàng TMCP Đại Chúng Việt Nam', shortName: 'PVcomBank', code: 'PVCB' },
  { bin: '970419', name: 'Ngân hàng TMCP Quốc Dân', shortName: 'NCB', code: 'NCB' },
  { bin: '970425', name: 'Ngân hàng TMCP An Bình', shortName: 'ABBANK', code: 'ABB' },
  { bin: '970427', name: 'Ngân hàng TMCP Việt Á', shortName: 'VietABank', code: 'VAB' },
  { bin: '970428', name: 'Ngân hàng TMCP Nam Á', shortName: 'NamABank', code: 'NAB' },
  { bin: '970430', name: 'Ngân hàng TMCP Thịnh vượng và Phát triển', shortName: 'PGBank', code: 'PGB' },
  { bin: '970433', name: 'Ngân hàng TMCP Việt Nam Thương Tín', shortName: 'VietBank', code: 'VIETBANK' },
  { bin: '970438', name: 'Ngân hàng TMCP Bảo Việt', shortName: 'BaoVietBank', code: 'BVB' },
  { bin: '970440', name: 'Ngân hàng TMCP Đông Nam Á', shortName: 'SeABank', code: 'SEAB' },
  { bin: '970449', name: 'Ngân hàng TMCP Lộc Phát Việt Nam', shortName: 'LPBank', code: 'LPB' },
  { bin: '970452', name: 'Ngân hàng TMCP Kiên Long', shortName: 'KienLongBank', code: 'KLB' },
  { bin: '970446', name: 'Ngân hàng Hợp tác xã Việt Nam', shortName: 'COOPBANK', code: 'COOPBANK' },
  { bin: '970424', name: 'Ngân hàng TNHH MTV Shinhan Việt Nam', shortName: 'ShinhanBank', code: 'SHBVN' },
  { bin: '970442', name: 'Ngân hàng TNHH MTV Hong Leong Việt Nam', shortName: 'HongLeong', code: 'HLBVN' },
  { bin: '970434', name: 'Ngân hàng TNHH Indovina', shortName: 'IndovinaBank', code: 'IVB' },
  { bin: '970410', name: 'Ngân hàng TNHH MTV Standard Chartered Bank Việt Nam', shortName: 'StandardChartered', code: 'SCVN' },
  { bin: '970439', name: 'Ngân hàng TNHH MTV Public Việt Nam', shortName: 'PublicBank', code: 'PBVN' },
]

export const BUILDINGS = [
  { code: 'ICT', name: 'อาคารเทคโนโลยีสารสนเทศและการสื่อสาร' },
  { code: 'CE', name: 'อาคารเรียนรวม' },
  { code: 'PKY', name: 'อาคารภูกามยาว' },
  { code: 'UB', name: 'อาคาร ๙๙ ปี พระอุบาลีคุณูปมาจารย์' },
  { code: 'DOME', name: 'UP Dome อาคารสงวนเสริมศรี' },
  { code: 'PYM', name: 'หอประชุมพญางำเมือง' },
];

// Add verified room numbers here. Shared options are always available.
export const ROOMS_BY_BUILDING = {
  ICT: ['พื้นที่ส่วนกลาง', 'ไม่ทราบห้อง'],
  CE: ['พื้นที่ส่วนกลาง', 'ไม่ทราบห้อง'],
  PKY: ['พื้นที่ส่วนกลาง', 'ไม่ทราบห้อง'],
  UB: ['พื้นที่ส่วนกลาง', 'ไม่ทราบห้อง'],
  DOME: ['พื้นที่ส่วนกลาง', 'ไม่ทราบห้อง'],
  PYM: ['พื้นที่ส่วนกลาง', 'ไม่ทราบห้อง'],
};

export const CATEGORIES = [
  'บัตรและเอกสาร',
  'กุญแจ',
  'อุปกรณ์อิเล็กทรอนิกส์',
  'กระเป๋าและกระเป๋าสตางค์',
  'ร่ม',
  'เสื้อผ้า',
  'เครื่องเขียน',
  'อื่น ๆ',
];

export const STATUS_LABELS = {
  OPEN: 'กำลังตามหา',
  CLAIM_PENDING: 'กำลังตรวจสอบ',
  MATCHED: 'พบเจ้าของแล้ว',
  RETURNED: 'ส่งคืนแล้ว',
  CLOSED: 'ปิดประกาศ',
};

export const CLAIM_STATUS_LABELS = {
  PENDING: 'รอตรวจสอบ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ไม่ผ่านการตรวจสอบ',
};

export const REPORT_LABELS = { LOST: 'ตามหาของหาย', FOUND: 'พบของ' };


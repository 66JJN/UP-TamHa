export const BUILDINGS = [
  { code: 'ICT', name: 'อาคารเทคโนโลยีสารสนเทศและการสื่อสาร', featured: true },
  { code: 'CE', name: 'อาคารเรียนรวม', featured: true },
  { code: 'PKY', name: 'อาคารภูกามยาว', featured: true },
  { code: 'UB', name: 'อาคาร ๙๙ ปี พระอุบาลีคุณูปมาจารย์', featured: true },
  { code: 'DOME', name: 'UP Dome อาคารสงวนเสริมศรี', featured: true },
  { code: 'PYM', name: 'หอประชุมพญางำเมือง', featured: true },
  { code: 'LIBRARY', name: 'หอสมุดกลาง' },
  { code: 'CANTEEN', name: 'โรงอาหารและศูนย์อาหาร' },
  { code: 'CAMPUS', name: 'พื้นที่กลางแจ้ง ถนน และทางเดินภายในมหาวิทยาลัย' },
  { code: 'BUS', name: 'รถโดยสารมหาวิทยาลัยและป้ายรถ' },
  { code: 'LAKE', name: 'อ่างหลวงและพื้นที่โดยรอบ' },
  { code: 'SPORT', name: 'สนามกีฬาและพื้นที่ออกกำลังกาย' },
  { code: 'DORM', name: 'หอพักนิสิตและบริเวณโดยรอบ' },
  { code: 'OTHER', name: 'สถานที่อื่นภายในมหาวิทยาลัย' },
];

export const CUSTOM_ROOM_VALUE = '__CUSTOM__';
const CUSTOM_AREA = 'ระบุห้องหรือบริเวณเอง';
const INDOOR_AREAS = ['ห้องเรียน/ห้องปฏิบัติการ', 'โถงอาคาร/ทางเดิน', 'พื้นที่อ่านหนังสือ', 'บันได/ลิฟต์', 'ห้องน้ำ', 'ลานจอดรถ', 'พื้นที่ส่วนกลาง', 'ไม่แน่ใจ/ไม่ทราบบริเวณ', CUSTOM_AREA];

export const ROOMS_BY_BUILDING = Object.fromEntries(BUILDINGS.map(({ code }) => [code, INDOOR_AREAS]));
Object.assign(ROOMS_BY_BUILDING, {
  CANTEEN: ['บริเวณโต๊ะนั่ง', 'ร้านอาหาร/จุดรับอาหาร', 'ทางเดินในโรงอาหาร', 'ห้องน้ำ', 'ลานจอดรถ', 'ไม่แน่ใจ/ไม่ทราบบริเวณ', CUSTOM_AREA],
  CAMPUS: ['ถนนภายในมหาวิทยาลัย', 'ทางเท้า/ทางเดินกลางแจ้ง', 'พื้นที่กลางแจ้ง/ลานกิจกรรม', 'ป้ายรถ/จุดรอรถ', 'ลานจอดรถ', 'ไม่แน่ใจ/ไม่ทราบบริเวณ', CUSTOM_AREA],
  BUS: ['บนรถโดยสารมหาวิทยาลัย', 'ป้ายรถ/จุดรอรถ', 'ระหว่างเส้นทางภายในมหาวิทยาลัย', 'ไม่ทราบสายหรือคันรถ', CUSTOM_AREA],
  LAKE: ['ทางเดินรอบอ่างหลวง', 'ลานกิจกรรมรอบอ่างหลวง', 'จุดนั่งพัก', 'ลานจอดรถ', 'ไม่แน่ใจ/ไม่ทราบบริเวณ', CUSTOM_AREA],
  SPORT: ['สนามกีฬา', 'อาคารกีฬา/ฟิตเนส', 'อัฒจันทร์', 'ห้องแต่งตัว/ห้องน้ำ', 'ลานจอดรถ', 'ไม่แน่ใจ/ไม่ทราบบริเวณ', CUSTOM_AREA],
  DORM: ['ภายในอาคารหอพัก', 'โถง/ทางเดิน', 'พื้นที่ส่วนกลาง', 'โรงอาหาร/ร้านค้าใกล้หอพัก', 'ลานจอดรถ', 'ไม่แน่ใจ/ไม่ทราบบริเวณ', CUSTOM_AREA],
  OTHER: ['พื้นที่ส่วนกลาง', 'พื้นที่กลางแจ้ง', 'ไม่แน่ใจ/ไม่ทราบบริเวณ', CUSTOM_AREA],
});

export function locationLabel(code) {
  return BUILDINGS.find((location) => location.code === code)?.name || code;
}

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
  APPROVED: 'ยืนยันแล้ว',
  REJECTED: 'ปฏิเสธแล้ว',
};

export const REPORT_LABELS = { LOST: 'ตามหาของหาย', FOUND: 'พบของ' };


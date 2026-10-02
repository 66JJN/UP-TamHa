const now = new Date();
const dateBefore = (days) => new Date(now.getTime() - days * 86400000).toISOString();

export const memoryStore = {
  profiles: [
    { id: '10000000-0000-4000-8000-000000000001', nickname: 'แอดมิน', avatar_kind: 'CAT', created_at: dateBefore(30) },
    { id: '10000000-0000-4000-8000-000000000002', nickname: 'ม่วง', avatar_kind: 'DOG', created_at: dateBefore(20) },
    { id: '10000000-0000-4000-8000-000000000003', nickname: 'ฟ้า', avatar_kind: 'CAT', created_at: dateBefore(15) },
  ],
  items: [
    { id: '20000000-0000-4000-8000-000000000001', owner_profile_id: '10000000-0000-4000-8000-000000000002', report_type: 'LOST', title: 'กระเป๋าสตางค์สีดำ', description: 'กระเป๋าหนังสีดำขนาดเล็ก ภายในมีบัตรหลายใบ กรุณาแจ้งรายละเอียดเพิ่มเติมเพื่อยืนยัน', category: 'กระเป๋าและกระเป๋าสตางค์', building_code: 'ICT', room: 'พื้นที่ส่วนกลาง', event_date: dateBefore(1), contact_note: 'ติดต่อผ่านคำขอรับของ', status: 'OPEN', created_at: dateBefore(1), updated_at: dateBefore(1) },
    { id: '20000000-0000-4000-8000-000000000002', owner_profile_id: '10000000-0000-4000-8000-000000000003', report_type: 'FOUND', title: 'กุญแจรถพร้อมพวงกุญแจ', description: 'พบกุญแจรถหนึ่งดอกพร้อมพวงกุญแจ บริเวณโต๊ะอ่านหนังสือ', category: 'กุญแจ', building_code: 'CE', room: 'พื้นที่ส่วนกลาง', event_date: dateBefore(2), contact_note: '', status: 'OPEN', created_at: dateBefore(2), updated_at: dateBefore(2) },
    { id: '20000000-0000-4000-8000-000000000003', owner_profile_id: '10000000-0000-4000-8000-000000000002', report_type: 'LOST', title: 'หูฟังไร้สายสีขาว', description: 'หูฟังพร้อมเคสชาร์จ มีรอยเล็กบริเวณด้านข้างเคส', category: 'อุปกรณ์อิเล็กทรอนิกส์', building_code: 'PKY', room: 'ไม่ทราบห้อง', event_date: dateBefore(3), contact_note: '', status: 'CLAIM_PENDING', created_at: dateBefore(3), updated_at: dateBefore(1) },
    { id: '20000000-0000-4000-8000-000000000004', owner_profile_id: '10000000-0000-4000-8000-000000000003', report_type: 'FOUND', title: 'ร่มพับสีน้ำเงิน', description: 'พบหลังเลิกเรียน วางอยู่ข้างประตูทางออก', category: 'ร่ม', building_code: 'UB', room: 'พื้นที่ส่วนกลาง', event_date: dateBefore(4), contact_note: '', status: 'OPEN', created_at: dateBefore(4), updated_at: dateBefore(4) },
    { id: '20000000-0000-4000-8000-000000000005', owner_profile_id: '10000000-0000-4000-8000-000000000003', report_type: 'FOUND', title: 'บัตรนิสิต', description: 'พบใกล้ทางเข้า ปิดข้อมูลรหัสนิสิตไว้เพื่อความเป็นส่วนตัว', category: 'บัตรและเอกสาร', building_code: 'DOME', room: 'พื้นที่ส่วนกลาง', event_date: dateBefore(5), contact_note: '', status: 'MATCHED', created_at: dateBefore(5), updated_at: dateBefore(1) },
    { id: '20000000-0000-4000-8000-000000000006', owner_profile_id: '10000000-0000-4000-8000-000000000002', report_type: 'LOST', title: 'สมุดโน้ตปกสีม่วง', description: 'สมุดจดขนาด A5 มีชื่อเล่นเขียนอยู่หน้าด้านใน', category: 'เครื่องเขียน', building_code: 'PYM', room: 'ไม่ทราบห้อง', event_date: dateBefore(7), contact_note: '', status: 'RETURNED', created_at: dateBefore(7), updated_at: dateBefore(2) },
  ],
  claims: [
    { id: '30000000-0000-4000-8000-000000000001', item_id: '20000000-0000-4000-8000-000000000003', claimant_profile_id: '10000000-0000-4000-8000-000000000003', proof_details: 'สามารถระบุยี่ห้อและตำแหน่งรอยบนเคสได้', status: 'PENDING', created_at: dateBefore(1), reviewed_at: null },
  ],
  images: [],
};

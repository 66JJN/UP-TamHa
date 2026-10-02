import { Backpack, CircleHelp, CreditCard, Headphones, KeyRound, NotebookPen, Shirt, Umbrella } from 'lucide-react';
import { imageUrl } from '../services/api.js';

const iconMap = {
  'บัตรและเอกสาร': CreditCard,
  'กุญแจ': KeyRound,
  'อุปกรณ์อิเล็กทรอนิกส์': Headphones,
  'กระเป๋าและกระเป๋าสตางค์': Backpack,
  'ร่ม': Umbrella,
  'เสื้อผ้า': Shirt,
  'เครื่องเขียน': NotebookPen,
  'อื่น ๆ': CircleHelp,
};

export default function ItemVisual({ item, large = false }) {
  const firstImage = item.images?.[0];
  if (firstImage) {
    return <img className={`item-photo ${large ? 'item-photo-large' : ''}`} src={imageUrl(firstImage.id)} alt={`รูป ${item.title}`} />;
  }
  const Icon = iconMap[item.category] || CircleHelp;
  return (
    <div className={`item-placeholder category-${item.report_type.toLowerCase()} ${large ? 'item-placeholder-large' : ''}`} aria-hidden="true">
      <Icon strokeWidth={1.5} />
    </div>
  );
}


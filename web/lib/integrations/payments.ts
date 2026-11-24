/**
 * ממשק לספק סליקה (PRD §5.3, §7). עד שייבחר ספק – מימוש מדומה:
 * הלקוח מועבר לדף תשלום פנימי לבדיקה. פרטי כרטיס לא נשמרים במערכת בשום מצב (PRD §8).
 * לחיבור ספק אמיתי: לממש createPaymentUrl שמחזיר כתובת לדף התשלום של הספק,
 * ו-webhook ב-app/api/payments/webhook שמסמן את ההזמנה כשולמה.
 */
export interface PaymentGateway {
  createPaymentUrl(order: { id: string; order_number: string; total_amount: string }): Promise<string>;
}

export const mockGateway: PaymentGateway = {
  async createPaymentUrl(order) {
    return `/pay/${order.id}`;
  },
};

export const paymentGateway: PaymentGateway = mockGateway;

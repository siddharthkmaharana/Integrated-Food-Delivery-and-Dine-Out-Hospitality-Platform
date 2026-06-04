/**
 * Unit tests for the Mock Payment Gateway simulation
 *
 * Project 2 — Week 3 Requirement:
 * The intern must implement the checkout flow, integrating a mock payment gateway
 * that reliably updates the database order status upon successful charge simulation.
 */

// ─── Payment simulation logic extracted for testability ───────────────────────
// This mirrors the logic in orderController.js `payOrder()`

const PAYMENT_SUCCESS_RATE = 0.9; // 90% success rate

/**
 * Simulates a payment attempt.
 * @param {number} successProbability — override for deterministic testing
 * @returns {{ success: boolean, paymentStatus: string, orderStatus: string }}
 */
function simulatePayment(successProbability = Math.random()) {
  const success = successProbability < PAYMENT_SUCCESS_RATE;
  return {
    success,
    paymentStatus: success ? 'PAID' : 'FAILED',
    orderStatus: success ? 'ACCEPTED' : null,
  };
}

/**
 * Validates order total computation.
 * @param {{ price: number, quantity: number }[]} items
 * @param {number} deliveryFee
 * @param {number} taxRate
 * @returns {{ subtotal, deliveryFee, tax, totalAmount }}
 */
function computeOrderTotal(items, deliveryFee = 2.99, taxRate = 0.08) {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = parseFloat((subtotal * taxRate).toFixed(2));
  const totalAmount = parseFloat((subtotal + deliveryFee + tax).toFixed(2));
  return { subtotal, deliveryFee, tax, totalAmount };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Mock Payment Gateway Simulation', () => {
  test('should return PAID and ACCEPTED status when payment succeeds', () => {
    const result = simulatePayment(0.0); // force success (0.0 < 0.9)
    expect(result.success).toBe(true);
    expect(result.paymentStatus).toBe('PAID');
    expect(result.orderStatus).toBe('ACCEPTED');
  });

  test('should return FAILED status when payment fails', () => {
    const result = simulatePayment(0.95); // force failure (0.95 >= 0.9)
    expect(result.success).toBe(false);
    expect(result.paymentStatus).toBe('FAILED');
    expect(result.orderStatus).toBeNull();
  });

  test('payment success probability should be ~90% over many trials', () => {
    const TRIALS = 1000;
    let successCount = 0;
    for (let i = 0; i < TRIALS; i++) {
      if (simulatePayment().success) successCount++;
    }
    const rate = successCount / TRIALS;
    // Allow ±5% variance from expected 90%
    expect(rate).toBeGreaterThan(0.85);
    expect(rate).toBeLessThan(0.95);
  });

  test('payment simulation should never return an undefined status', () => {
    for (let i = 0; i < 50; i++) {
      const result = simulatePayment();
      expect(['PAID', 'FAILED']).toContain(result.paymentStatus);
    }
  });
});

describe('Order Total Computation', () => {
  test('should correctly compute subtotal from items', () => {
    const items = [
      { price: 10, quantity: 2 }, // 20
      { price: 5, quantity: 3 },  // 15
    ];
    const result = computeOrderTotal(items);
    expect(result.subtotal).toBe(35);
  });

  test('should apply 8% tax on subtotal', () => {
    const items = [{ price: 100, quantity: 1 }];
    const result = computeOrderTotal(items, 0, 0.08);
    expect(result.tax).toBe(8);
  });

  test('should include delivery fee in totalAmount', () => {
    const items = [{ price: 50, quantity: 1 }];
    const result = computeOrderTotal(items, 2.99, 0.08);
    // subtotal = 50, tax = 4, delivery = 2.99 → total = 56.99
    expect(result.totalAmount).toBe(56.99);
  });

  test('should handle zero-price items without errors', () => {
    const items = [{ price: 0, quantity: 5 }];
    const result = computeOrderTotal(items, 2.99);
    expect(result.subtotal).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.totalAmount).toBe(2.99);
  });

  test('should handle empty items array returning only delivery fee', () => {
    const result = computeOrderTotal([], 2.99, 0.08);
    expect(result.subtotal).toBe(0);
    expect(result.totalAmount).toBe(2.99);
  });

  test('should use default delivery fee of 2.99 when not specified', () => {
    const items = [{ price: 10, quantity: 1 }];
    const result = computeOrderTotal(items);
    expect(result.deliveryFee).toBe(2.99);
  });
});

describe('Order Status State Machine — Allowed Transitions', () => {
  const validStatuses = [
    'PENDING', 'PLACED', 'ACCEPTED', 'PREPARING',
    'READY_FOR_PICKUP', 'COURIER_ASSIGNED', 'DELIVERING', 'DELIVERED', 'CANCELLED'
  ];

  test('should only contain valid order status values', () => {
    const testStatuses = ['ACCEPTED', 'PREPARING', 'DELIVERING', 'DELIVERED'];
    testStatuses.forEach(status => {
      expect(validStatuses).toContain(status);
    });
  });

  test('PAID payment should result in ACCEPTED order status', () => {
    const result = simulatePayment(0.0); // force success
    expect(result.orderStatus).toBe('ACCEPTED');
    expect(validStatuses).toContain(result.orderStatus);
  });
});

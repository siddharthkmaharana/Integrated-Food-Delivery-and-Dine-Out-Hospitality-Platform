/**
 * Unit tests for Cart Total Calculation Logic
 *
 * Project 2 — Week 3 Requirement:
 * The intern must implement the cart calculation algorithm on the client side,
 * computing the final price by aggregating unit prices, applying dynamic discount
 * matrices, and incorporating localized taxation rates.
 */

// ─── Cart calculation logic (mirrors frontend Cart.jsx) ──────────────────────

const TAX_RATE = 0.08;
const DEFAULT_DELIVERY_FEE = 2.99;

/**
 * Computes cart summary with dynamic discount support.
 * @param {{ price: number, quantity: number, name: string, restaurantId: string }[]} items
 * @param {number} deliveryFee
 * @param {{ type: 'percentage'|'fixed', value: number, minOrder?: number } | null} discount
 * @returns {{ subtotal, discountAmount, tax, deliveryFee, total }}
 */
function computeCartTotal(items, deliveryFee = DEFAULT_DELIVERY_FEE, discount = null) {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  let discountAmount = 0;
  if (discount && subtotal >= (discount.minOrder || 0)) {
    if (discount.type === 'percentage') {
      discountAmount = parseFloat((subtotal * (discount.value / 100)).toFixed(2));
    } else if (discount.type === 'fixed') {
      discountAmount = Math.min(discount.value, subtotal); // cannot exceed subtotal
    }
  }

  const discountedSubtotal = subtotal - discountAmount;
  const tax = parseFloat((discountedSubtotal * TAX_RATE).toFixed(2));
  const total = parseFloat((discountedSubtotal + tax + deliveryFee).toFixed(2));

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discountAmount,
    tax,
    deliveryFee,
    total
  };
}

/**
 * Checks whether all items in a cart belong to the same restaurant.
 * Project 2 requirement: Prevent users from adding items from multiple restaurants.
 * @param {{ restaurantId: string }[]} items
 * @returns {boolean} true if cart is valid (single restaurant)
 */
function isValidSingleRestaurantCart(items) {
  if (!items || items.length === 0) return true;
  const restaurantIds = [...new Set(items.map(i => i.restaurantId))];
  return restaurantIds.length === 1;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Cart Subtotal Computation', () => {
  test('should correctly sum item prices × quantities', () => {
    const items = [
      { price: 10, quantity: 2, restaurantId: 'r1' }, // 20
      { price: 15, quantity: 1, restaurantId: 'r1' }, // 15
    ];
    const result = computeCartTotal(items);
    expect(result.subtotal).toBe(35);
  });

  test('should return 0 subtotal for empty cart', () => {
    const result = computeCartTotal([]);
    expect(result.subtotal).toBe(0);
  });

  test('should handle decimal prices correctly', () => {
    const items = [
      { price: 9.99, quantity: 3, restaurantId: 'r1' },  // 29.97
    ];
    const result = computeCartTotal(items);
    expect(result.subtotal).toBeCloseTo(29.97, 2);
  });
});

describe('Tax Calculation', () => {
  test('should apply 8% tax on discounted subtotal', () => {
    const items = [{ price: 100, quantity: 1, restaurantId: 'r1' }];
    const result = computeCartTotal(items, 0); // no delivery fee for isolation
    expect(result.tax).toBeCloseTo(8, 1);
  });

  test('tax should be applied after discount', () => {
    const items = [{ price: 100, quantity: 1, restaurantId: 'r1' }];
    const discount = { type: 'percentage', value: 10 }; // 10% off
    const result = computeCartTotal(items, 0, discount);
    // After 10% discount: subtotal = 90, tax = 7.20
    expect(result.discountAmount).toBe(10);
    expect(result.tax).toBeCloseTo(7.2, 1);
  });
});

describe('Dynamic Discount Matrix', () => {
  test('should apply percentage discount correctly', () => {
    const items = [{ price: 200, quantity: 1, restaurantId: 'r1' }];
    const discount = { type: 'percentage', value: 20 };
    const result = computeCartTotal(items, 0, discount);
    expect(result.discountAmount).toBe(40);
  });

  test('should apply fixed discount correctly', () => {
    const items = [{ price: 500, quantity: 1, restaurantId: 'r1' }];
    const discount = { type: 'fixed', value: 50 };
    const result = computeCartTotal(items, 0, discount);
    expect(result.discountAmount).toBe(50);
  });

  test('fixed discount should not exceed subtotal', () => {
    const items = [{ price: 10, quantity: 1, restaurantId: 'r1' }];
    const discount = { type: 'fixed', value: 100 }; // bigger than order
    const result = computeCartTotal(items, 0, discount);
    expect(result.discountAmount).toBe(10); // capped at subtotal
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  test('should not apply discount if order is below minimum', () => {
    const items = [{ price: 50, quantity: 1, restaurantId: 'r1' }];
    const discount = { type: 'percentage', value: 15, minOrder: 100 };
    const result = computeCartTotal(items, 0, discount);
    expect(result.discountAmount).toBe(0); // minimum not met
  });

  test('should apply discount when order meets minimum exactly', () => {
    const items = [{ price: 100, quantity: 1, restaurantId: 'r1' }];
    const discount = { type: 'percentage', value: 10, minOrder: 100 };
    const result = computeCartTotal(items, 0, discount);
    expect(result.discountAmount).toBe(10);
  });
});

describe('Multi-Restaurant Cart Guard (Project 2 Core Requirement)', () => {
  test('should allow a cart with items from the same restaurant', () => {
    const items = [
      { price: 10, quantity: 1, restaurantId: 'restaurant_abc' },
      { price: 20, quantity: 2, restaurantId: 'restaurant_abc' },
    ];
    expect(isValidSingleRestaurantCart(items)).toBe(true);
  });

  test('should reject a cart with items from multiple restaurants', () => {
    const items = [
      { price: 10, quantity: 1, restaurantId: 'restaurant_abc' },
      { price: 20, quantity: 1, restaurantId: 'restaurant_xyz' }, // different!
    ];
    expect(isValidSingleRestaurantCart(items)).toBe(false);
  });

  test('should allow an empty cart', () => {
    expect(isValidSingleRestaurantCart([])).toBe(true);
  });

  test('should allow a single-item cart', () => {
    const items = [{ price: 10, quantity: 1, restaurantId: 'restaurant_abc' }];
    expect(isValidSingleRestaurantCart(items)).toBe(true);
  });
});

describe('Full Cart Total Integration', () => {
  test('should compute correct final total with all components', () => {
    const items = [
      { price: 100, quantity: 1, restaurantId: 'r1' },
      { price: 50, quantity: 2, restaurantId: 'r1' },  // subtotal = 200
    ];
    const discount = { type: 'percentage', value: 10 }; // -20 → 180
    const result = computeCartTotal(items, 2.99, discount);

    expect(result.subtotal).toBe(200);
    expect(result.discountAmount).toBe(20);
    // tax on 180 = 14.40
    expect(result.tax).toBeCloseTo(14.4, 1);
    // total = 180 + 14.40 + 2.99 = 197.39
    expect(result.total).toBeCloseTo(197.39, 1);
  });
});

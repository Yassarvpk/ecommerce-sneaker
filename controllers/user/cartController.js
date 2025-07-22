const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const Order = require('../../models/orderModel');

const showCart = async (req, res) => {
  try {
    if (!req.session.user) {
      req.session.message = 'Please log in to view your cart';
      return res.redirect('/login');
    }

    const user = await User.findById(req.session.user.id).populate('cart.productId');
    const cart = user.cart || [];

    res.render('user/cart', {
      cart,
      message: req.session.message || null,
    });
    delete req.session.message;
  } catch (err) {
    console.error('❌ Error loading cart:', err.message);
    req.session.message = 'Error loading cart';
    res.redirect('/dashboard');
  }
};

const addToCart = async (req, res) => {
  try {
    if (!req.session.user) {
      req.session.message = 'Please log in to add to cart';
      return res.redirect('/login');
    }

    const productId = req.params.id;
    const userId = req.session.user.id;

    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product || product.stock === 0) {
      req.session.message = 'Product not available';
      return res.redirect(`/products/${productId}`);
    }

    await User.updateOne(
      { _id: userId, 'cart.productId': { $ne: productId } },
      { $addToSet: { cart: { productId, quantity: 1 } } }
    );

    req.session.message = 'Product added to cart';
    res.redirect(`/products/${productId}`);
  } catch (err) {
    console.error('❌ Error adding to cart:', err.message);
    req.session.message = 'Error adding to cart';
    res.redirect(`/products/${productId}`);
  }
};

const updateCart = async (req, res) => {
  try {
    if (!req.session.user) {
      req.session.message = 'Please log in to update cart';
      return res.redirect('/login');
    }

    const productId = req.params.id;
    const userId = req.session.user.id;
    const quantity = parseInt(req.body.quantity);

    if (quantity < 1) {
      req.session.message = 'Quantity must be at least 1';
      return res.redirect('/cart');
    }

    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product || product.stock < quantity) {
      req.session.message = 'Insufficient stock';
      return res.redirect('/cart');
    }

    await User.updateOne(
      { _id: userId, 'cart.productId': productId },
      { $set: { 'cart.$.quantity': quantity } }
    );

    req.session.message = 'Cart updated';
    res.redirect('/cart');
  } catch (err) {
    console.error('❌ Error updating cart:', err.message);
    req.session.message = 'Error updating cart';
    res.redirect('/cart');
  }
};

const removeFromCart = async (req, res) => {
  try {
    if (!req.session.user) {
      req.session.message = 'Please log in to remove items';
      return res.redirect('/login');
    }

    const productId = req.params.id;
    const userId = req.session.user.id;

    await User.updateOne(
      { _id: userId },
      { $pull: { cart: { productId } } }
    );

    req.session.message = 'Item removed from cart';
    res.redirect('/cart');
  } catch (err) {
    console.error('❌ Error removing from cart:', err.message);
    req.session.message = 'Error removing item';
    res.redirect('/cart');
  }
};

const showCheckout = async (req, res) => {
  try {
    if (!req.session.user) {
      req.session.message = 'Please log in to checkout';
      return res.redirect('/login');
    }

    const user = await User.findById(req.session.user.id).populate('cart.productId');
    const cart = user.cart || [];

    if (cart.length === 0) {
      req.session.message = 'Your cart is empty';
      return res.redirect('/cart');
    }

    res.render('user/checkout', {
      cart,
      user,
      paymentMethod: 'cod',
      message: req.session.message || null,
    });
    delete req.session.message;
  } catch (err) {
    console.error('❌ Error loading checkout:', err.message);
    req.session.message = 'Error loading checkout';
    res.redirect('/cart');
  }
};

const placeOrder = async (req, res) => {
  try {
    if (!req.session.user) {
      req.session.message = 'Please log in to place an order';
      return res.redirect('/login');
    }

    const { address, city, postalCode, paymentMethod } = req.body;
    const userId = req.session.user.id;

    if (!address || !city || !postalCode || !paymentMethod) {
      req.session.message = 'All fields are required';
      return res.redirect('/checkout');
    }

    const user = await User.findById(userId).populate('cart.productId');
    const cart = user.cart || [];

    if (cart.length === 0) {
      req.session.message = 'Your cart is empty';
      return res.redirect('/cart');
    }

    // Validate stock
    for (const item of cart) {
      const product = await Product.findById(item.productId._id);
      if (!product || product.stock < item.quantity) {
        req.session.message = `Insufficient stock for ${item.productId.name}`;
        return res.redirect('/checkout');
      }
    }

    // Create order
    const order = new Order({
      userId,
      items: cart.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price,
      })),
      total: cart.reduce((sum, item) => sum + item.productId.price * item.quantity, 0),
      shippingAddress: { address, city, postalCode },
      paymentMethod,
      status: 'pending',
    });

    await order.save();

    // Update stock
    for (const item of cart) {
      await Product.updateOne(
        { _id: item.productId._id },
        { $inc: { stock: -item.quantity } }
      );
    }

    // Clear cart
    await User.updateOne({ _id: userId }, { $set: { cart: [] } });

    // Update user address
    await User.updateOne(
      { _id: userId },
      { $set: { address, city, postalCode } }
    );

    req.session.message = 'Order placed successfully';
    res.redirect('/orders');
  } catch (err) {
    console.error('❌ Error placing order:', err.message);
    req.session.message = 'Error placing order';
    res.redirect('/checkout');
  }
};

const showOrders = async (req, res) => {
  try {
    if (!req.session.user) {
      req.session.message = 'Please log in to view orders';
      return res.redirect('/login');
    }

    const orders = await Order.find({ userId: req.session.user.id }).populate('items.productId');

    res.render('user/orders', {
      orders,
      message: req.session.message || null,
    });
    delete req.session.message;
  } catch (err) {
    console.error('❌ Error loading orders:', err.message);
    req.session.message = 'Error loading orders';
    res.redirect('/dashboard');
  }
};

const showOrderDetails = async (req, res) => {
  try {
    if (!req.session.user) {
      req.session.message = 'Please log in to view order details';
      return res.redirect('/login');
    }

    const order = await Order.findOne({ _id: req.params.id, userId: req.session.user.id }).populate('items.productId');
    if (!order) {
      req.session.message = 'Order not found';
      return res.redirect('/orders');
    }

    res.render('user/orderDetails', {
      order,
      message: req.session.message || null,
    });
    delete req.session.message;
  } catch (err) {
    console.error('❌ Error loading order details:', err.message);
    req.session.message = 'Error loading order details';
    res.redirect('/orders');
  }
};

module.exports = {
  showCart,
  addToCart,
  updateCart,
  removeFromCart,
  showCheckout,
  placeOrder,
  showOrders,
  showOrderDetails,
};
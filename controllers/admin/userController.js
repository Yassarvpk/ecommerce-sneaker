const User = require('../../models/userModel');

  const listUsers = async (req, res) => {
    try {
      const searchQuery = req.query.userSearch || '';
      const page = parseInt(req.query.userPage) || 1;
      const limit = 10;
      let query = { isDeleted: false };
      if (searchQuery) {
        query.$or = [
          { fullName: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } }
        ];
      }
      const totalUsers = await User.countDocuments(query);
      const users = await User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      console.log(`Fetched ${users.length} users for page ${page}, search: "${searchQuery}"`);
      const totalPages = Math.ceil(totalUsers / limit);
      const currentPage = Math.min(Math.max(page, 1), totalPages || 1);
      return { users, userSearch: searchQuery, currentUserPage: currentPage, totalUserPages: totalPages };
    } catch (err) {
      console.error('❌ Error listing users:', err.message);
      throw err;
    }
  };

  const toggleBlock = async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);
      if (!user) {
        req.session.message = 'User not found';
        return res.redirect('/admin/dashboard?tab=users');
      }
      user.isBlocked = !user.isBlocked;
      await user.save();
      console.log(`User ${userId} ${user.isBlocked ? 'blocked' : 'unblocked'}`);
      req.session.message = `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`;
      res.redirect('/admin/dashboard?tab=users');
    } catch (err) {
      console.error('❌ Error toggling block:', err.message);
      req.session.message = 'Error toggling user block status';
      res.redirect('/admin/dashboard?tab=users');
    }
  };

  module.exports = { listUsers, toggleBlock };
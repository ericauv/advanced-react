const { forwardTo } = require('prisma-binding');
const { hasPermission } = require('../utils');
const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  async me(parent, args, ctx, info) {
    // Check if there is a current user Id
    if (!ctx.request.userId) {
      return null;
    }
    const user = await ctx.db.query.user(
      {
        where: { id: ctx.request.userId }
      },
      info
    );
    console.log(user);
    return user;
  },
  async users(parent, args, ctx, info) {
    // 1. Check if logged in
    if (!ctx.request.userId) {
      throw new Error('You need to be logged in to do that');
    }
    // 2. Check if the user has permissions to query all users
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE']);

    // 3. Query all users
    return ctx.db.query.users({}, info);
  }
};

module.exports = Query;

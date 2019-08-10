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
  },
  async order(parent, args, ctx, info) {
    const userId = ctx.request.userId;
    // 1. Check that user is signed in
    if (!userId) {
      throw new Error('You are not signed in!');
    }

    // 2. Query the order
    const order = await ctx.db.query.order(
      {
        where: {
          id: args.id
        }
      },
      info
    );
    if (!order) {
      throw new Error(`Order with id: ${args.id} not found.`);
    }

    // 3. Check if user owns order or has permission to view order
    const ownsOrder = order.user.id === userId;
    const hasPermissionToViewOrder = ctx.request.user.permissions.includes(
      'ADMIN'
    );
    if (!ownsOrder && !hasPermissionToViewOrder) {
      throw new Error('You do not have permission to view this order!');
    }

    // 5. Return the order
    return order;
  },
  async orders(parent, args, ctx, info) {
    // 1. Check that they are signed in
    if (!ctx.request.userId) {
      throw new Error('Please sign in to view orders.');
    }
    // 2. Check if they have permission to view orders
    const hasPermissionToViewOrders = ctx.request.user.permissions.includes(
      'ADMIN'
    );
    if (!hasPermissionToViewOrders) {
      throw new Error('You do not have permission to view orders!');
    }
    // 3. Query orders
    const orders = await ctx.db.query.orders({}, info);
    console.log(orders);

    // 4. Return the orders
    return orders;
  }
};

module.exports = Query;

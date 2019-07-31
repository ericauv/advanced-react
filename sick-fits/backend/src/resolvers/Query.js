const { forwardTo } = require('prisma-binding');

const Query = {
  //   async items(parent, args, ctx, info) {
  //     const items = await ctx.db.query.items();
  //     return items;
  //   }
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  me(parent, args, ctx, info) {
    // Check if there is a current user Id
    if (!ctx.request.userId) {
      console.log('WAS NULL!');
      return null;
    }
    return ctx.db.query.user(
      {
        where: { id: ctx.request.userId }
      },
      info
    );
  }
};

module.exports = Query;

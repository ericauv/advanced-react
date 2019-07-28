const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: Check if they are logged in

    const item = await ctx.db.mutation.createItem(
      {
        data: {
          ...args
        }
      },
      info
    );
    console.log(item);

    return item;
  },
  updateItem(parent, args, ctx, info) {
    //first take a copy of updates
    const updates = { ...args };
    // Remove id from updates (since it cannot be updated)
    delete updates.id;
    // run update method
    return ctx.db.mutation.updateItem(
      { data: updates, where: { id: args.id } },
      info
    );
  }
};

module.exports = Mutations;

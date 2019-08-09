const bcrypt = require('bcryptjs');
const stripe = require('../stripe');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto'); // for reset Token
const { promisify } = require('util'); // to promisify reset Token
const { transport, makeANiceEmail } = require('../mail');
const { hasPermission } = require('../utils');
const createTokenCookie = (userId, ctx) => {
  const token = jwt.sign({ userId }, process.env.APP_SECRET);
  ctx.response.cookie('token', token, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year token
  });
  return token;
};
const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in to do that!');
    }
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          ...args,
          // Create a relationship betweem the item and the user
          user: {
            connect: {
              id: ctx.request.userId
            }
          }
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
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // 1. Find the item
    const item = await ctx.db.query.item({ where }, `{id title user{id}}`);

    // 2. Check if user owns the item or has permission to delete
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some(permission =>
      ['ADMIN', 'ITEMDELETE'].includes(permission)
    );
    // 3. Check if user owns the item
    if (!(ownsItem || hasPermissions)) {
      throw new Error('Oops! You do not have permission to delete this item!');
    }
    // 4. Run delete item method
    return ctx.db.mutation.deleteItem({ where }, info);
  },
  async signup(parent, args, ctx, info) {
    args.email = args.email.toLowerCase();
    // hash password
    const password = await bcrypt.hash(args.password, 10);
    //create user in database
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ['USER'] }
        }
      },
      info
    );
    //create JWT token, set cookie on the response
    createTokenCookie(user.id, ctx);
    // return user to browser
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    // 1. Check if there is a user with the email
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // 2. Check if password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid password');
    }
    // 3. Generate JWT token, set cookie with the token
    createTokenCookie(user.id, ctx);

    // 5. Return the user
    return user;
  },
  signout(parents, args, ctx, info) {
    // 1. Set token to null
    ctx.response.clearCookie('token');
    // 2. Return the user
    return { message: 'Successfully signed out' };
  },
  async requestReset(parent, args, ctx, info) {
    // 1. Check if this is a real user
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
      throw new Error(`No such user found for email ${args.email}`);
    }

    // 2. Set a reset token and expiry on that user
    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 1000 * 60 * 60; // 1 hour from now
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry }
    });
    // 3. Email them that reset token
    const mailRes = await transport.sendMail({
      from: 'bud@bud.com',
      to: user.email,
      subject: 'Your Password Reset Token',
      html: makeANiceEmail(`Your Password Reset Token is here!\n\n
      <a href=${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}
      }>Click Here to Reset </a>`)
    });

    // 4. Return message
    return { message: 'Thanks' };
  },
  async resetPassword(
    parent,
    { resetToken, newPassword, confirmPassword },
    ctx,
    info
  ) {
    // 1. Check if the passwords match
    if (newPassword !== confirmPassword) {
      throw new Error('Whoops! Your passwords do not match.');
    }
    // 2. Check if its a valid reset token, and is not expired
    const [user] = await ctx.db.query.users({
      where: { resetToken, resetTokenExpiry_gte: Date.now() - 3600000 }
    });
    if (!user) {
      throw new Error(
        'This token is either invalid or expired. Please request a new password reset token.'
      );
    }

    // 4. Hash new password
    const password = await bcrypt.hash(newPassword, 10);
    // 5. Save new password to user, remove old reset token fields
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null
      }
    });
    // 6. Generate jwt, set cookie to response
    createTokenCookie(updatedUser.id, ctx);
    // 8. Return the new user
    return updatedUser;
  },
  async updatePermissions(parent, args, ctx, info) {
    // 1. Check if user is logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in to do that!');
    }
    // 2. Query the current user
    const currentUser = await ctx.db.query.user(
      {
        where: {
          id: ctx.request.userId // Need to get currently signed in user to check if they have permission to update
        }
      },
      info
    );

    // 3. Check if user has sufficient permissions
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
    // 4. Update permissions
    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions
          }
        },
        where: { id: args.userId } // May be updating different user than that which is logged in
      },
      info
    );
  },
  async addToCart(parent, args, ctx, info) {
    // 1. Check if signed in
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error('Please sign in to add items to cart');
    }
    // 2. Query User's current cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id }
      }
    });
    console.log(existingCartItem, args.id, userId);

    // 3. Check if item is already in Cart, increment quantity by 1 if it is
    if (existingCartItem) {
      console.log('This item is already in their cart');
      return ctx.db.mutation.updateCartItem(
        {
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + 1 }
        },
        info
      );
    }
    console.log(args, userId);
    // 4. If item not already in cart, create new CartItem
    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: { id: userId }
          },
          item: {
            connect: { id: args.id }
          }
        }
      },
      info
    );
  },
  async removeFromCart(parent, args, ctx, info) {
    console.log(args);

    // 1. Find the cart item
    const cartItem = await ctx.db.query.cartItem(
      {
        where: { id: args.id }
      },
      `{id quantity user{id}}`
    );
    if (!cartItem) {
      throw new Error('No CartItem Found!');
    }
    console.log(cartItem);

    // 2. Make sure they own that cart item
    if (cartItem.user.id !== ctx.request.userId) {
      throw new Error('You must own the cart item in order to remove it!');
    }
    console.log('deleting');

    //3. Delete the cart item
    return await ctx.db.mutation.deleteCartItem(
      { where: { id: args.id } },
      info
    );
  },
  async createOrder(parent, args, ctx, info) {
    // 1. Query current user, and make sure they are signed in
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error('You must be signed in to complete this order.');
    }

    const user = await ctx.db.query.user(
      {
        where: {
          id: userId
        }
      },
      `{
        id
        name
        email
        cart {
          id
          quantity
          item {
            title
            price
            id
            description
            image
            largeImage
          }
        }
      }`
    );
    // 2. Recalculate the total for the price
    const amount = user.cart.reduce(
      (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity,
      0
    );

    // 3. Create the stripe charge
    const charge = await stripe.charges.create({
      amount,
      currency: 'USD',
      source: args.token
    });

    // 4. Convert CartItems to OrderItems
    const orderItems = user.cart.map(cartItem => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: {
          connect: {
            id: userId
          }
        }
      };
      delete orderItem.id;
      return orderItem;
    });

    // 5. Create Order
    const order = await ctx.db.mutation.createOrder(
      {
        data: {
          total: charge.amount,
          charge: charge.id,
          items: { create: orderItems },
          user: {
            connect: {
              id: userId
            }
          }
        }
      },
      info
    );

    // 6. Clean up - Clear User's cart, delete cartItems
    const cartItemIds = user.cart.map(cartItem => cartItem.id);
    await ctx.db.mutation.deleteManyCartItems(
      {
        where: {
          id_in: cartItemIds
        }
      },
      info
    );

    // 7. Return order to the client
    return order;
  }
};

module.exports = Mutations;

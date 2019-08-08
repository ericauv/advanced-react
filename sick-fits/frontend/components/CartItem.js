import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import React from 'react';
import formatMoney from '../lib/formatMoney';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { CURRENT_USER_QUERY } from './User';
import RemoveFromCart from './RemoveFromCart';

const CartItemStyles = styled.li`
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.theme.lightgrey};
  display: grid;
  align-items: center;
  grid-template-columns: auto 1fr auto auto;
  img {
    margin-right: 10px;
  }
  h3,
  p {
    margin: 0;
  }
`;

const CartItem = ({ cartItem }) => {
  // Check if the item exists
  if (!cartItem.item)
    return (
      <CartItemStyles>
        <p>This item has been removed.</p>
        <RemoveFromCart id={cartItem.id} />
      </CartItemStyles>
    );
  const { item } = cartItem;
  return (
    <CartItemStyles>
      <img width="100" src={item.image} alt={cartItem.title} />
      <div className="cart-item-details">
        <h3>{item.title}</h3>
        <p>
          {formatMoney(item.price * cartItem.quantity)}
          {' - '}
          <em>
            {cartItem.quantity} &times; {formatMoney(item.price)} each
          </em>
        </p>
        <RemoveFromCart id={cartItem.id} />
      </div>
    </CartItemStyles>
  );
};

CartItem.propTypes = {
  cartItem: PropTypes.object.isRequired
};
export default CartItem;

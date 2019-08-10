import React, { Component } from 'react';
import formatMoney from '../lib/formatMoney';
import PropTypes from 'prop-types';

const OrderItem = props => {
  const { item } = props;
  return (
    <div className="order-item" key={item.id}>
      <img src={item.image} alt={item.title} />
      <div className="item-details">
        <h2>{item.title}</h2>
        <p>Qty: {item.quantity}</p>
        <p>Each: {formatMoney(item.price)}</p>
        <p>SubTotal: {formatMoney(item.price * item.quantity)}</p>
        <p>{item.description}</p>
      </div>
    </div>
  );
};

OrderItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    price: PropTypes.number.isRequired,
    description: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired
  }).isRequired
};

export default OrderItem;

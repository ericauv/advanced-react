import React from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { formatDistance } from 'date-fns';
import styled from 'styled-components';
import Link from 'next/link';
import Error from './ErrorMessage';
import OrderItemStyles from './styles/OrderItemStyles';
import formatMoney from '../lib/formatMoney';

const USER_ORDERS_QUERY = gql`
  query USER_ORDERS_QUERY {
    orders(orderBy: createdAt_DESC) {
      id
      total
      createdAt
      items {
        id
        price
        description
        quantity
        image
      }
    }
  }
`;

const OrdersUl = styled.ul`
  display: grid;
  grid-gap: 4rem;
  grid-template-columns: repeat(auto-fit, minmax(40%, 1fr));
`;

const OrderList = props => (
  <Query query={USER_ORDERS_QUERY}>
    {({ data: { orders }, error, loading }) => {
      if (error) return <Error error={error} />;
      if (loading) return <p>Loading...</p>;
      const ordersLength = orders.length;
      console.log(orders);

      return (
        <div>
          <h2>
            You have {ordersLength} order
            {ordersLength > 1 || ordersLength === 0 ? 's' : ''}.
          </h2>
          <OrdersUl>
            {orders.map(order => (
              <OrderItemStyles key={order.id}>
                <Link
                  href={{
                    pathname: '/order',
                    query: { id: order.id }
                  }}
                >
                  <a>
                    <div className="order-meta">
                      <p>
                        {order.items.reduce(
                          (tally, item) => tally + item.quantity,
                          0
                        )}{' '}
                        Items
                      </p>
                      <p>{order.items.length} Products</p>
                      <p>{formatDistance(order.createdAt, new Date())} ago</p>
                      <p>{formatMoney(order.total)}</p>
                    </div>
                    <div className="images">
                      {order.items.map(item => (
                        <img key={item.id} src={item.image} alt={item.title} />
                      ))}
                    </div>
                  </a>
                </Link>
              </OrderItemStyles>
            ))}
          </OrdersUl>
        </div>
      );
    }}
  </Query>
);
export default OrderList;

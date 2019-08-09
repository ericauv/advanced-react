import React from 'react';
import StripeCheckout from 'react-stripe-checkout';
import { Mutation } from 'react-apollo';
import Router from 'next/router';
import NProgress from 'nprogress';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import calcTotalPrice from '../lib/calcTotalPrice';
import Error from './ErrorMessage';
import User, { CURRENT_USER_QUERY } from './User';

function totalItems(cart) {
  return cart.reduce((tally, cartItem) => tally + cartItem.quantity, 0);
}

const CREATE_ORDER_MUTATION = gql`
  mutation CREATE_ORDER_MUTATION($token: String!) {
    createOrder(token: $token) {
      id
      items {
        id
        title
      }
      total
      charge
    }
  }
`;

class TakeMyMoney extends React.Component {
  onToken = (res, createOrder) => {
    console.log('onToken called');
    console.log(res.id);

    // Call Mutation once we have the stripe token
    createOrder({
      variables: {
        token: res.id
      }
    }).catch(err => {
      alert(err.message);
    });
  };
  render() {
    return (
      <User>
        {({ data: { me } }) => (
          <Mutation
            mutation={CREATE_ORDER_MUTATION}
            refetchQueries={CURRENT_USER_QUERY}
          >
            {(createOrder, { error, loading }) => (
              <StripeCheckout
                amount={calcTotalPrice(me.cart)}
                name="Sick Fits"
                description={`Order of ${totalItems(me.cart)} items`}
                image={me.cart[0].item && me.cart[0].item.image}
                stripeKey="pk_test_HyD9cJ324Q9qasGMyYZXLqJh00YCHdNNV3"
                currency="USD"
                email={me.email}
                token={res => this.onToken(res, createOrder)}
              >
                {this.props.children}
              </StripeCheckout>
            )}
          </Mutation>
        )}
      </User>
    );
  }
}

export default TakeMyMoney;

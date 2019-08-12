import { mount } from 'enzyme';
import { MockedProvider } from 'react-apollo/test-utils';
import wait from 'waait';
import toJSON from 'enzyme-to-json';
import Router from 'next/router';
import Pagination, { PAGINATION_QUERY } from '../components/Pagination';

Router.router = {
  push() {},
  prefetch() {}
};

function makeMocksFor(length) {
  return [
    {
      request: { query: PAGINATION_QUERY },
      result: {
        data: {
          itemsConnection: {
            __typename: 'aggregate',
            aggregate: {
              __typename: 'count',
              count: length
            }
          }
        }
      }
    }
  ];
}

describe('<Pagination/>', () => {
  it('displays a loading message', () => {
    const wrapper = mount(
      <MockedProvider mocks={makeMocksFor(1)}>
        <Pagination page={1} />
      </MockedProvider>
    );

    expect(wrapper.text()).toContain('Loading...');
  });
  it('renders pagination for 20 items', async () => {
    const wrapper = mount(
      <MockedProvider mocks={makeMocksFor(20)}>
        <Pagination page={1} />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    expect(wrapper.find('.totalPages').text()).toEqual('5');
    const pagination = wrapper.find('div[data-test="pagination"]');
    expect(toJSON(pagination)).toMatchSnapshot();
  });
  it('disables next button on last page', async () => {
    const wrapper = mount(
      <MockedProvider mocks={makeMocksFor(20)}>
        <Pagination page={5} />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    expect(wrapper.find('a.prev').prop('aria-disabled')).toBe(false);
    expect(wrapper.find('a.next').prop('aria-disabled')).toBe(true);
  });
  it('disables prev button on first page', async () => {
    const wrapper = mount(
      <MockedProvider mocks={makeMocksFor(20)}>
        <Pagination page={1} />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    expect(wrapper.find('a.prev').prop('aria-disabled')).toBe(true);
    expect(wrapper.find('a.next').prop('aria-disabled')).toBe(false);
  });
  it('enables both prev and next buttons on non-terminal pages', async () => {
    const wrapper = mount(
      <MockedProvider mocks={makeMocksFor(20)}>
        <Pagination page={2} />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    expect(wrapper.find('a.next').prop('aria-disabled')).toBe(false);
    expect(wrapper.find('a.prev').prop('aria-disabled')).toBe(false);
  });
});

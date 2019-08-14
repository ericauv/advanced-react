import wait from 'waait';
import { MockedProvider } from 'react-apollo/test-utils';
import { mount } from 'enzyme';
import toJSON from 'enzyme-to-json';
import Router from 'next/router';
import CreateItem, { CREATE_ITEM_MUTATION } from '../components/CreateItem';
import { fakeItem } from '../lib/testUtils';

const testImage = 'https://testImage.com/test.jpeg';

// mock fetch API
global.fetch = jest.fn().mockResolvedValue({
  json: () => ({
    secure_url: testImage,
    eager: [{ secure_url: testImage }]
  })
});
describe('<CreateItem></CreateItem>', () => {
  it('renders the form', () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    const form = wrapper.find('form');
    expect(toJSON(form)).toMatchSnapshot();
  });
  it('uploads image when changed', async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    wrapper
      .find('input[type="file"]')
      .simulate('change', { target: { files: ['test.jpeg'] } });
    await wait();
    wrapper.update();
    const component = wrapper.find('CreateItem').instance();
    expect(component.state.image).toEqual(testImage);
    expect(component.state.largeImage).toEqual(testImage);
    expect(global.fetch).toHaveBeenCalled();
    global.fetch.mockClear();
  });

  it('handles state updating on input change', async () => {
    const wrapper = mount(
      <MockedProvider>
        <CreateItem />
      </MockedProvider>
    );
    const price = 101;
    const description = 'test-description';
    const title = 'test-title';
    wrapper.find('input#title').simulate('change', {
      target: { name: 'title', type: 'text', value: title }
    });
    wrapper.find('input#price').simulate('change', {
      target: { name: 'price', type: 'number', value: price }
    });
    wrapper.find('textarea#description').simulate('change', {
      target: { name: 'description', type: 'text', value: description }
    });

    expect(wrapper.find('CreateItem').instance().state).toMatchObject({
      title,
      price,
      description
    });
  });
  it('creates item when form is submitted', async () => {
    const item = fakeItem();
    const mocks = [
      {
        request: {
          query: CREATE_ITEM_MUTATION,
          variables: {
            title: item.title,
            description: item.description,
            largeImage: item.largeImage,
            image: item.image,
            price: item.price
          }
        },
        result: {
          data: {
            createItem: {
              id: item.id,
              __typename: 'Item'
            }
          }
        }
      }
    ];
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <CreateItem />
      </MockedProvider>
    );

    // simulate form input
    wrapper.find('input#title').simulate('change', {
      target: { name: 'title', type: 'text', value: item.title }
    });
    wrapper.find('input#price').simulate('change', {
      target: { name: 'price', type: 'number', value: item.price }
    });
    wrapper.find('textarea#description').simulate('change', {
      target: { name: 'description', type: 'text', value: item.description }
    });
    const component = wrapper.find('CreateItem').instance();

    // simulate image uploaded
    component.state.image = item.image;
    component.state.largeImage = item.largeImage;

    wrapper.find('form').simulate('submit');
    // simulate router
    Router.router = {
      push: jest.fn()
    };
    // waiting to ensure that routing occurs
    await wait(50);
    expect(Router.router.push).toHaveBeenCalled();
    expect(Router.router.push).toHaveBeenCalledWith({
      pathname: '/item',
      query: { id: item.id }
    });
  });
});

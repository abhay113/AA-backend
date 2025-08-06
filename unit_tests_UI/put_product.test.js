const chai = require('chai');
const chaiHttp = require('chai-http');
const app = 'http://localhost:3003/api/fiu/v1';
let token = ''

chai.use(chaiHttp);
const expect = chai.expect;
// eslint-disable-next-line no-undef
describe('Updating a product\'s details by its ID', () => {
  // Assuming you have a valid product ID and updated product details defined somewhere
  const validProductId = ""
  const updatedProductDetails = {
    
        "productName": "loan",
        "ConsentDetail": [] // replace with actual body
      }      
  
   // Test case for when token is invalid
   // eslint-disable-next-line no-undef
   it('User receives an error if the token is invalid', function (done) {

    chai.request(app)
      .put(`/products/${validProductId}`)
      .auth(token, { type: 'bearer' })
      .send(updatedProductDetails)
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(401);
        // expect(res.body).to.have.property('error').that.includes('Invalid');
        done();
      });
  });
// eslint-disable-next-line no-undef
  it('should successfully update a product\'s details by its ID', (done) => {
    chai
      .request(app)
      .put(`/products/${validProductId}`)
      .auth(token, { type: 'bearer' })
      .send(updatedProductDetails)
      .end(() => {

        done();
      });
  });
// eslint-disable-next-line no-undef
  it('should receive an error if the product ID is not found', (done) => {
    const invalidProductId = ""
    chai
      .request(app)
      .put(`/products/${invalidProductId}`)
      .auth(token, { type: 'bearer' })
      .send(updatedProductDetails)
      .end((err, res) => {
        expect(res).to.have.status(404);
        // Add additional assertions here to check the response content
        done();
      });
  });

// eslint-disable-next-line no-undef
  it('should receive an error if the request body is not in the correct format', (done) => {
    const invalidProductId = ""
    chai
      .request(app)
      .put(`/products/${invalidProductId}`)
      .auth(token, { type: 'bearer' })
      .send({ 'invalidField': 'invalidValue' }) // Invalid format
      .end((err, res) => {
        expect(res).to.have.status(404);
        // Add additional assertions here to check the response content
        done();
      });
  });

// eslint-disable-next-line no-undef
  it('should receive an error if the server encounters an issue', (done) => {
    // Simulate a server issue by making your server return a 500 status code
    chai
      .request(app)
      .put(`/products/${validProductId}`)
      .auth(token, { type: 'bearer' })
      // eslint-disable-next-line no-undef
      .send(value = 1)
      .end((err, res) => {
        expect(res).to.have.status(500);
        // Add additional assertions here to check the response content
        done();
      });
  });
});

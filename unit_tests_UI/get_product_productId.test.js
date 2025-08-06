const chai = require('chai');
const chaiHttp = require('chai-http');
const app = 'http://localhost:3003/api/fiu/v1';
let token = ""; //replace with valid token

chai.use(chaiHttp);
const expect = chai.expect;
// eslint-disable-next-line no-undef
describe('Product Details API - Retrieving product details by product ID', () => {
  const validProductId = '';
  const invalidProductId = '';
  const nonExistentProductId = '';

  // Test case for when token is invalid
  // eslint-disable-next-line no-undef
  it('User receives an error if the token is invalid', function (done) {

    chai.request(app)
    .get(`/products/${invalidProductId}`)
        .auth(token, { type: 'bearer' })
        .end(function (err, res) {
            if (err) return done(err);

            expect(res).to.have.status(401);
            // expect(res.body).to.have.property('error').that.includes('Invalid');
            done();
        });
});

  // Scenario 1: User successfully retrieves product details by a valid product ID
  // eslint-disable-next-line no-undef
  it('should successfully retrieve product details for a valid product ID', (done) => {
    chai
      .request(app)
      .get(`/products/${validProductId}`)
      .auth(token, { type: 'bearer' })
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });


  // Scenario 3: User receives an error if the product ID does not exist
  // eslint-disable-next-line no-undef
  it('should receive an error for a non-existent/invalid product ID', (done) => {
    chai
      .request(app)
      .get(`/products/${nonExistentProductId}`)
      .auth(token, { type: 'bearer' })
      .end((err, res) => {
        expect(res).to.have.status(404);
        done();
      });
  });

  // Scenario 4: User receives an error if the server encounters an issue
  // eslint-disable-next-line no-undef
  it('should receive an error if the server encounters an issue', (done) => {
    chai
      .request(app)
      .get(`/products/${validProductId}`)
      .auth(token, { type: 'bearer' })
      .end((err, res) => {
        expect(res).to.have.status(500);
        expect(res.body).to.have.property('error');
  
        expect(res.body.error.errorMessage).to.equal('Internal Server Error');
  
        done();
      });
  });
})
  

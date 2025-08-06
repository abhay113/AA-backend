const chai = require('chai');
const chaiHttp = require('chai-http');
const app = 'http://localhost:3003/api/fiu/v1';
let token = ''
chai.use(chaiHttp);
const expect = chai.expect;
const productBody = {}
// eslint-disable-next-line no-undef
describe('Product API', () => {
  // Test case for when token is invalid
  // eslint-disable-next-line no-undef
  it('User receives an error if the token is invalid', function (done) {

    chai.request(app)
      .post('/product')
      .auth(token, { type: 'bearer' })
      .send(productBody)
      .end(function (err, res) {
        if (err) return done(err);

        expect(res).to.have.status(401);
        // expect(res.body).to.have.property('error').that.includes('Invalid');
        done();
      });
  });
// eslint-disable-next-line no-undef
  it('should successfully create a new product', async function () {
    // eslint-disable-next-line no-useless-catch
    try {
      const res = await chai.request(app)
        .post('/product')
        .auth(token, { type: 'bearer' })
        .send(productBody);

      expect(res).to.have.status(200);
    } catch (err) {
      throw err; // You should handle errors properly here
    }
  });

// eslint-disable-next-line no-undef
  it('should return a 400 error if the request body is empty', async function () {
    // eslint-disable-next-line no-useless-catch
    try {
      const res = await chai.request(app)
        .post('/product')
        .auth(token, { type: 'bearer' })
        .send({});

      expect(res).to.have.status(400);
    } catch (err) {
      throw err; // You should handle errors properly here
    }
  });
// eslint-disable-next-line no-undef
  it('should return a 400 error if the request body is not in the correct format', (done) => {
    const invalidproductBody = {
      "ConsentDetail": [] //replace with actual body
    }
    chai
      .request(app)
      .post('/product')
      .auth(token, { type: 'bearer' })
      .send({ invalidproductBody })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('errorMessage');
        done();
      });
  });


// eslint-disable-next-line no-undef
  it('should return a 500 error if the server encounters an issue', (done) => {
    chai
      .request(app)
      .post('/product')
      .auth(token, { type: 'bearer' })
      .send({ /* valid product information */ })
      .end((err, res) => {
        expect(res).to.have.status(500);
        expect(res.body).to.have.property('errorMessage');
        done();
      });
  });
});
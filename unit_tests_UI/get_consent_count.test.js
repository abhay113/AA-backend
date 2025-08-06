const chai = require('chai');
const chaiHttp = require('chai-http');
const app ='http://localhost:3003/api/fiu/v1';

chai.use(chaiHttp);
const expect = chai.expect;

// eslint-disable-next-line no-undef
describe('Getting the count of requests', () => {
  // eslint-disable-next-line no-undef
  it('should successfully get the count of requests', (done) => {
    chai
      .request(app)
      .get('/consents/count')
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });
  // eslint-disable-next-line no-undef
  it('should receive an error if the server encounters an issue', (done) => {
    chai
      .request(app)
      .get('/consents/count')
      .end((err, res) => {
        expect(res).to.have.status(500);
        expect(res.body).to.have.property('error');
        done();
      });
  });
});

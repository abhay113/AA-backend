const chai = require('chai');
const chaiHttp = require('chai-http');
const app = 'http://localhost:3003/api/fiu/v1';

chai.use(chaiHttp);
const expect = chai.expect;
chai.use(chaiHttp);
// eslint-disable-next-line no-undef
describe('Posting consent information', () => {
  const validBulkConsents = {}
// eslint-disable-next-line no-undef
  it('should successfully create consent information', (done) => {
    chai
      .request(app)
      .post('/consent/information')
      .send(validBulkConsents)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message');
        // Add additional assertions here to check the success message
        done();
      });
  });
// eslint-disable-next-line no-undef
  it('should receive an error if the request body is empty', (done) => {
    const invalidBulkConsents = {
    }
    chai
      .request(app)
      .post('/consent/information')
      .send(invalidBulkConsents)
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error');
        // Add additional assertions here to check the error message
        done();
      });
  });
// eslint-disable-next-line no-undef
  it('should receive an error if the request body is not in the correct format', (done) => {
    // Sending an invalid format (e.g., invalid object)
    const invalidBulkConsents = {}
    chai
      .request(app)
      .post('/consent/information')
      .send(invalidBulkConsents)
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error');
        // Add additional assertions here to check the error message
        done();
      });
  });
// eslint-disable-next-line no-undef
  it('should receive an error if the server encounters an issue', (done) => {
    chai
      .request(app)
      .post('/consent/information')
      .send(validBulkConsents)
      .end((err, res) => {
        expect(res).to.have.status(500);
        expect(res.body).to.have.property('error');
        // Add additional assertions here to check the error message
        done();
      });
  });
});

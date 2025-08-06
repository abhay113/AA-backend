const chai = require('chai');
const chaiHttp = require('chai-http');
const app ='http://localhost:3003/api/fiu/v1';

chai.use(chaiHttp);
const expect = chai.expect;
// eslint-disable-next-line no-undef
describe('Posting an array of bulk consents', () => {
  const validBulkConsents = [];
// eslint-disable-next-line no-undef
  it('should successfully post an array of bulk consents', (done) => {
    chai
      .request(app)
      .post('/consents')
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
    chai
      .request(app)
      .post('/consents')
      .send([]) 
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error');
        // Add additional assertions here to check the error message
        done();
      });
  });
// eslint-disable-next-line no-undef
  it('should receive an error if the request body is not in the correct format', (done) => {
    // Sending an invalid format (e.g., a single object instead of an array)
    chai
      .request(app)
      .post('/consents')
      .send(validBulkConsents[0])
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error');
        // Add additional assertions here to check the error message
        done();
      });
  });
// eslint-disable-next-line no-undef
  it('should receive an error if the request is not valid', (done) => {
    // Sending an object that doesn't match the expected structure
    chai
      .request(app)
      .post('/consents')
      .send({ value: 1 }) // Invalid data
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
      .post('/consents')
      .send(validBulkConsents)
      .end((err, res) => {
        expect(res).to.have.status(500);
        expect(res.body).to.have.property('error');
        // Add additional assertions here to check the error message
        done();
      });
  });
});

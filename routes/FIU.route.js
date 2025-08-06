const express = require('express');
const { FIUController } = require('../controllers/index');
const {  consentRequestSchema, ConsentNotificationSchema, productRequestSchema, bulkFiRequestsSchema} = require("../validator/validations");

const middleware = require("../middlewares/schemaValidation");


const FIURoute = express.Router();
const multer = require('multer');
const fs = require('fs-extra'); // Import fs-extra

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('I am saving file using multer');


    // Define the destination directory
    const dir = "uploads/";

    // Set the file_id in the request body
    // req.body.file_id = file_id;

    // Create the directory using fs-extra's mkdirp
    fs.mkdirp(dir) // Use fs.mkdirp here
      .then(made => {
        console.log("made:", made);
        cb(null, dir);
      })
      .catch(error => {
        console.log(error);
      });
  },
  filename: function (req, file, cb) {
    // Use the original filename for the uploaded file
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });


/** consent routes */
FIURoute.post('/consents', FIUController.postBulkConsent)
FIURoute.post('/consentsIFrame', FIUController.postBulkConsentIFrame)
FIURoute.post('/consent', middleware(consentRequestSchema), FIUController.postConsent)
FIURoute.get('/consent/:consentId', FIUController.getConsentInfoByConsentId)
FIURoute.post('/consent/notifcation', middleware(ConsentNotificationSchema), FIUController.postConsentNotification)
FIURoute.post('/consent/information', FIUController.postConsentInformation)
FIURoute.get('/consentStatus/count', FIUController.getConsentsCount)
FIURoute.get('/consents', FIUController.getConsentsByFilters)
FIURoute.get('/consents/:consent_request_id', FIUController.getConsentsByConsentRequestId)
FIURoute.get('/consentStatus/:consentHandle', FIUController.getStatusByConsentHandle)

/** fi request routes */
FIURoute.get('/fi/requestStatus/:sessionId', FIUController.getFiRequestStatus)
FIURoute.post('/fi/request/:consentHandle', FIUController.postFIRequest)
FIURoute.get('/fi/request/:sessionId', FIUController.getFIRequestBySessionId)
FIURoute.get('/fi/fetch/:sessionId', FIUController.getFinancialInfo)
FIURoute.post('/fi/notification', FIUController.postFINotification)
FIURoute.post('/fi/data/:sessionId', FIUController.postFIdata)
FIURoute.get('/fi/requests/count', FIUController.getRequestCount)
FIURoute.get('/fi/requests', FIUController.getFiRequestsByFilters)
FIURoute.get('/fi/decrypt/:sessionId', FIUController.getDecryptedFI)
FIURoute.post('/automation/fi/request', FIUController.automateFiRequest)

FIURoute.get('/customer/count', FIUController.customerCount)
FIURoute.get('/fiTypes/count', FIUController.fiTypesCount)
FIURoute.get('/fi/requests/aggregators',FIUController.getAggregatorsByFiRequest)
FIURoute.get('/aggregators/consent',FIUController.getAggregatorsByConsent)
FIURoute.get('/consentExpiry/count',FIUController.getConsentExpiryCount)
FIURoute.get('/fi/requests/fiType/count',FIUController.getFiTypesByFiRequest)
FIURoute.get('/role/:role_id',FIUController.getRole)
FIURoute.get('/roles',FIUController.getAllRoles)

/** download routes */
FIURoute.get('/download/:sessionId', FIUController.xmlConverter)
FIURoute.post('/downloadPDF/:sessionId', FIUController.xmlConverterToPdf)
FIURoute.post('/download', FIUController.generateDepositReport)
FIURoute.get('/analytics/:sessionId', FIUController.generateAnalyticsReport)
FIURoute.post('/bsa/reportDownload', FIUController.bsaReportDownload)
FIURoute.get('/bsa/report/:sessionId', FIUController.getBsaReport)

/** aggregator routes */
FIURoute.get('/aggregators', FIUController.getAllAggregators)
FIURoute.get('/aggregator/:aggregator_id', FIUController.getAggregatorDetailsbyId)
FIURoute.put('/aggregator/:aggregator_id', FIUController.updateAggregatorDetailsById)
FIURoute.put('/aggregator/status/:aggregator_id', FIUController.updateAggregatorStatus)
FIURoute.put('/aggregator/setDefault/:aggregator_id', FIUController.setDefaultAggregator)

/** product routes */
FIURoute.post('/product', middleware(productRequestSchema), FIUController.postProduct)

FIURoute.delete('/products/:product_id', FIUController.deleteProduct)
FIURoute.put('/products/:product_id', FIUController.updateProduct)
FIURoute.get('/products/:product_id', FIUController.getProductDetailsbyId)
FIURoute.get('/products', FIUController.getAllProductDetails)

FIURoute.post('/draft/product', FIUController.postDraftProduct)

/** master table routes */
FIURoute.get('/purposeCodes', FIUController.getAllPurposeCodes)
FIURoute.get('/consentModes', FIUController.getAllConsentModes)
FIURoute.get('/consentTypes', FIUController.getAllConsentTypes)
FIURoute.get('/fiTypes', FIUController.getAllFiTypes)
FIURoute.get('/operators', FIUController.getAllOperators)
// FIURoute.get('/masterTables', FIUController.getAllMasterTableData) //dont remove

/**  */
FIURoute.post('/realm/logoutUser', FIUController.logoutUser)
FIURoute.get('/getData/:tableName/:columnName/:columnValue', FIUController.getTableDataByValue);

/** configuration routes */
FIURoute.get('/configurations', FIUController.getAllConfigurations)
FIURoute.post('/branding/configuration', upload.single('image'), FIUController.brandingConfiguration);
FIURoute.get('/branding/configuration', FIUController.getBrandConfiguration);
FIURoute.put('/branding/configuration/:config_id',upload.single('image'),FIUController.updateBrandingConfiguration);
FIURoute.delete('/branding/configuration/:config_id', FIUController.deleteBrandingConfiguration);
FIURoute.get('/consentTrail/:correlationId', FIUController.getConsentTrail);


/**  */
FIURoute.get('/generateSession', FIUController.authServerGenerateSession)
FIURoute.post('/consent/sms', FIUController.sendSms)

/** scheduler */
FIURoute.post('/schedule',FIUController.postScheduler)
FIURoute.get('/scheduleList/:consentHandle',FIUController.getScheduler)
FIURoute.post('/schedulePause/:queueName/pause',FIUController.pauseScheduler)
FIURoute.post('/scheduleResume/:queueName/resume',FIUController.resumeScheduler)
FIURoute.post('/scheduleDetail',FIUController.postQueueJob)

/** Analytical report */
FIURoute.get('/analyticalReports',FIUController.getAnalyticalReports)
FIURoute.get('/analyticalReports/:consentHandle',FIUController.getAnalyticalReportByConsentHandle)

/* Client congiguration*/
FIURoute.get('/realmConfig/:realm',FIUController.getAllRealmConfig);
FIURoute.put('/realmConfig/:realm',FIUController.updateRealConfig);

/* webhook url*/
FIURoute.post('/fiData',FIUController.postFiRequestData);

/* AUTH Routes */ 
FIURoute.post('/:realmId/session', FIUController.generateSession); 
FIURoute.post('/:realmId/consents', FIUController.validateSession); 
FIURoute.get('/activeAggregators',FIUController.getActiveAggregators); 
FIURoute.get('/default/aggregator',FIUController.getDefaultAggregator);
FIURoute.get('/product/:productId',FIUController.getProductDetailsbyProductId); //done (response same diff is middleware need auth)
FIURoute.get('/branding/configurations',FIUController.getBrandConfigurations); //done (get responseh here but for mid get empty arry)
FIURoute.get('/masterTables',FIUController.getAllMasterTableDetailsData); //done (response same diff is middleware need auth)
// FIURoute.get('/masterTablesDetails',FIUController.getAllMasterTableDetailsData); //done (response same diff is middleware need auth)//
// use the above route not this
FIURoute.post('/sm/bsa', FIUController.getBsaReportAuth)

//count and details of fi fetches
FIURoute.get('/fi/fetchReport',FIUController.getFiFetchCountDetails)

FIURoute.post('/fi/requests',middleware(bulkFiRequestsSchema), FIUController.postBulkFIRequets)

FIURoute.get('/fi/requests/status',FIUController.postBulkFIRequetStatus)


module.exports = FIURoute


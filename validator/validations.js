const Joi = require('joi');


const consentRequestSchema = Joi.object({
  ConsentDetail: Joi.object({
    consentStart: Joi.string().isoDate().required(),
    consentExpiry: Joi.string().isoDate().required(),
    consentMode: Joi.string().valid('VIEW', 'STORE', 'QUERY', 'STREAM').required(),
    fetchType: Joi.string().valid('ONETIME', 'PERIODIC').required(),
    consentTypes: Joi.array().items(Joi.string().valid('PROFILE', 'TRANSACTIONS', 'SUMMARY')).required(),
    fiTypes: Joi.array().items(Joi.string().valid('DEPOSIT', 'TERM_DEPOSIT', 'RECURRING_DEPOSIT', 'SIP', 'CP', 'GOVT_SECURITIES', 'EQUITIES', 'BONDS', 'DEBENTURES', 'MUTUAL_FUNDS', 'ETF', 'IDR', 'CIS', 'AIF', 'INSURANCE_POLICIES', 'NPS', 'INVIT', 'REIT', 'OTHER')).required(),
    // DataConsumer: Joi.object({
    //   id: Joi.string().required(),
    // }).required(),
    Customer: Joi.object({
      id: Joi.string().required()
    }).required(),
    Purpose: Joi.object({
      code: Joi.string().valid('101', '102', '103', '104', '105').required(),
      refUri: Joi.string().uri().allow(null),
      text: Joi.string().required(),
      Category: Joi.object({
        type: Joi.string().required()
      }).required()
    }).required(),
    FIDataRange: Joi.object({
      from: Joi.string().isoDate().required(),
      to: Joi.string().isoDate().required()
    }).required(),
    DataLife: Joi.object({
      unit: Joi.string().valid('DAY', 'INF', 'MONTH', 'YEAR').required(),
      value: Joi.number().integer().min(0).required()
    }).required(),
    Frequency: Joi.object({
      unit: Joi.string().valid('HOUR', 'DAY', 'INF', 'MONTH', 'YEAR').required(),
      value: Joi.number().integer().min(1).required()
    }).required(),
    DataFilter: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('TRANSACTIONTYPE', 'TRANSACTIONAMOUNT').required(),
        operator: Joi.string().valid('=', '!=', '>', '<', '>=', '<=','==').required(),
        value: Joi.string().required()
      })
    ).required()
  }).required()
});


const consentSchema = Joi.object({
  ver: Joi.string().required(),
  txnid: Joi.string().guid().required(),
  timestamp: Joi.string().isoDate().required(),
  consentId: Joi.string().required(),
  status: Joi.string().valid('ACTIVE', 'PAUSED', 'REVOKED', 'EXPIRED').required(),
  createTimestamp: Joi.string().isoDate().required(),
  // consentHandle: Joi.string().required(),
  signedConsent: Joi.string().required(),
  ConsentUse: Joi.object({
    logUri: Joi.string().required(),
    count: Joi.number().required(),
    lastUseDateTime: Joi.string().isoDate().required(),
  }).required()
});



const FISchema = Joi.object({
  FIDataRange: Joi.object({
    from: Joi.string().required(),
    to: Joi.string().required(),
  }).required(),
  Consent: Joi.object({
    id: Joi.string().required(),
    digitalSignature: Joi.string().required(),
  }).required(),
})


const ConsentNotificationSchema = Joi.object({
  ver: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  txnid: Joi.string().guid().required(),
  Notifier: Joi.object({
    type: Joi.string().required(),
    id: Joi.string().required(),
  }).required(),
  ConsentStatusNotification: Joi.object({
    consentId: Joi.string().guid().required(),
    consentHandle: Joi.string().guid().required(),
    consentStatus: Joi.string().valid('ACTIVE', 'PENDING', 'REVOKED', 'PAUSED', 'REJECTED', 'EXPIRED').required(),
  }).required(),
});

const FINotificationSchema = Joi.object({
  ver: Joi.string().required(),
  timestamp: Joi.string().isoDate().required(),
  txnid: Joi.string().required(),
  Notifier: Joi.object({
    type: Joi.string().valid('FIP').required(),
    id: Joi.string().required(),
  }).required(),
  FIStatusNotification: Joi.object({
    sessionId: Joi.string().required(),
    sessionStatus: Joi.string().valid('ACTIVE', 'COMPLETED', 'EXPIRED', 'FAILED').required(),
    FIStatusResponse: Joi.array().items(
      Joi.object({
        fipID: Joi.string().required(),
        Accounts: Joi.array().items(
          Joi.object({
            linkRefNumber: Joi.string().required(),
            FIStatus: Joi.string().valid('READY', 'DENIED', 'PENDING', 'DELIVERED', 'TIMEOUT').required(),
            description: Joi.string().allow('').required(),
          })
        ).required(),
      })
    ).required(),
  }).required(),
});


const productRequestSchema = Joi.object({
  productName: Joi.string().required(),
  ConsentDetail: Joi.array().items(Joi.object({
    consentStart: Joi.string().isoDate().required(),
    consentExpiry: Joi.string().isoDate().required(),
    consentMode: Joi.string().valid('VIEW', 'STORE', 'QUERY', 'STREAM').required(),
    fetchType: Joi.string().valid('ONETIME', 'PERIODIC').required(),
    consentTypes: Joi.array().items(Joi.string().valid('PROFILE', 'TRANSACTIONS', 'SUMMARY')).required(),
    fiTypes: Joi.array().items(Joi.string().valid('DEPOSIT', 'TERM_DEPOSIT', 'RECURRING_DEPOSIT', 'SIP', 'CP', 'GOVT_SECURITIES', 'EQUITIES', 'BONDS', 'DEBENTURES', 'MUTUAL_FUNDS', 'ETF', 'IDR', 'CIS', 'AIF', 'INSURANCE_POLICIES', 'NPS', 'INVIT', 'REIT', 'OTHER')).required(),
    // DataConsumer: Joi.object({
    //   id: Joi.string().required(),
    // }).required(),
    Purpose: Joi.object({
      code: Joi.string().valid('101', '102', '103', '104', '105').required(),
      refUri: Joi.string().uri().allow(null),
      text: Joi.string().required(),
      Category: Joi.object({
        type: Joi.string().required()
      }).required()
    }).required(),
    FIDataRange: Joi.object({
      from: Joi.string().isoDate().required(),
      to: Joi.string().isoDate().required()
    }).required(),
    DataLife: Joi.object({
      unit: Joi.string().valid('DAY', 'INF', 'MONTH', 'YEAR').required(),
      value: Joi.number().integer().min(0).required()
    }).required(),
    Frequency: Joi.object({
      unit: Joi.string().valid('HOUR', 'DAY', 'INF', 'MONTH', 'YEAR').required(),
      value: Joi.number().integer().min(1).required()
    }).required(),
    DataFilter: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('TRANSACTIONTYPE', 'TRANSACTIONAMOUNT').required(),
        operator: Joi.string().valid('=', '!=', '>', '<', '>=', '<=','==').required(),
        value: Joi.string().required()
      })

    ).required(),
    verified: Joi.string().allow('').optional(),
    hidden: Joi.boolean().required(),
    freqType: Joi.string().valid('MINUTE', 'HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR').required(),
    freqValue: Joi.number().integer().required(),
    consentNumber: Joi.number().allow('').optional(),
    consentDate: Joi.string().allow('').optional(),
    fiNumber: Joi.string().allow('').optional(),
    fiDate: Joi.string().allow('').optional(),
    dataLifeNumber: Joi.number().allow('').optional(),
    dataLifeDate: Joi.string().allow('').optional(),
    FIDataRangeFrom: Joi.string().allow('').optional(),
    FIDataRangeTo: Joi.string().allow('').optional(),    
  })
  ).required(),
  status: Joi.string().valid('ACTIVE').required()
});

const bulkFiRequestsSchema = Joi.array().items(
  Joi.string().guid({ version: ['uuidv4'] }).required()
).min(1).required();


module.exports = { consentSchema, consentRequestSchema, FISchema, ConsentNotificationSchema, FINotificationSchema, productRequestSchema, bulkFiRequestsSchema }
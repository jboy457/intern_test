const axios = require('axios');
const crypto = require('crypto');
const logger = require('morgan');
const express = require('express');
const CSVToJSON = require('csvtojson');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');

const app = express();

// Configure App
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Validate URL
const validate = () => [
  body('csv.url').isString().isURL().not().isEmpty().withMessage(''),
]


// ************ REGISTER ROUTES HERE ********** //
app.get('/csv_filter', validate(), async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors.array();
      return res.status(422).json({
        status: 'error',
        message: 'Please input a valid URL'
      });
    }
    const { url }= req.body.csv;

    // check if its a CSV link
    const link_ext = url.substr(url.length - 3);
    if(link_ext != 'csv') {
      return res.status(422).json({
        status: 'error',
        message: 'Url its not a csv link'
      });
    }

    // Load CSV from link
    const csvData = await axios.get(url);
   
    // convert CSV to JSON
    let jsonData = await CSVToJSON().fromString(csvData.data);

    // Filter if selected field is given
    if(Array.isArray(req.body.csv.select_fields) && req.body.csv.select_fields.length > 0) {
      jsonData = jsonData.map(item => req.body.csv.select_fields.reduce((acc, key) => ({...acc, [key]: item[key]}), {}));
    }

    // generate conversion key
    const conversion_key = crypto.randomBytes(32).toString('hex')
    return res.status(200).json({
      status: 'success',
      conversion_key,
      json: jsonData
    });

  } catch(err) {
    console.log(err);
    return res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
})
// ************ END ROUTE REGISTRATION ********** //


const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})
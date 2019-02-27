<?php

require_once('vendor/autoload.php');

header("Access-Control-Allow-Origin: *");

use GlobalPayments\Api\ServicesConfig;
use GlobalPayments\Api\Services\HostedService;
use GlobalPayments\Api\Entities\Exceptions\ApiException;

$db = new \MicroDB\Database('data/posts');

// configure client settings
$config = new ServicesConfig();
$config->merchantId = "MerchantId";
$config->accountId = "internet";
$config->sharedSecret = "secret";
$config->serviceUrl = "https://pay.sandbox.realexpayments.com/pay";

$service = new HostedService($config);

function parseBase64Response($response, $encoded = false)
{
    $response = json_decode($response, true);
    
    return [
      "AVSADDRESSRESULT" => base64_decode($response["AVSADDRESSRESULT"]),
      "CVNRESULT" => base64_decode($response["CVNRESULT"]),
      "PASREF" => base64_decode($response["PASREF"]),
      "CARD_STORAGE_ENABLE" => base64_decode($response["CARD_STORAGE_ENABLE"]),
      "BATCHID" => base64_decode($response["BATCHID"]),
      "MESSAGE" => base64_decode($response["MESSAGE"]),
      "ACCOUNT" => base64_decode($response["ACCOUNT"]),
      "SHA1HASH" => base64_decode($response["SHA1HASH"]),
      "AVSPOSTCODERESULT" => base64_decode($response["AVSPOSTCODERESULT"]),
      "ORDER_ID" => base64_decode($response["ORDER_ID"]),
      "AMOUNT" => base64_decode($response["AMOUNT"]),
      "TIMESTAMP" => base64_decode($response["TIMESTAMP"]),
      "pas_uuid" => base64_decode($response["pas_uuid"]),
      "RESULT" => base64_decode($response["RESULT"]),
      "AUTHCODE" => base64_decode($response["AUTHCODE"]),
      "MERCHANT_ID" => base64_decode($response["MERCHANT_ID"]),
    ];
}

/*
 * TODO: grab the response JSON from the client-side.
 * sample response JSON (values will be Base64 encoded):
 * $responseJson ='{"MERCHANT_ID":"MerchantId","ACCOUNT":"internet","ORDER_ID":"GTI5Yxb0SumL_TkDMCAxQA","AMOUNT":"1999",' .
 * '"TIMESTAMP":"20170725154824","SHA1HASH":"843680654f377bfa845387fdbace35acc9d95778","RESULT":"00","AUTHCODE":"12345",' .
 * '"CARD_PAYMENT_BUTTON":"Place Order","AVSADDRESSRESULT":"M","AVSPOSTCODERESULT":"M","BATCHID":"445196",' .
 * '"MESSAGE":"[ test system ] Authorised","PASREF":"15011597872195765","CVNRESULT":"M","HPP_FRAUDFILTER_RESULT":"PASS",' .
 * '"PAYER_SETUP":"00","PAYER_SETUP_MSG":"Successful","SAVED_PAYER_REF":"5e7e9152-2d53-466d-91bc-6d12ebc56b79",' .
 * '"PMT_SETUP":"00","PMT_SETUP_MSG":"Successful","SAVED_PMT_REF":"ca68dcac-9af2-4d65-b06c-eb54667dcd4a",' .
 * '"SAVED_PMT_TYPE":"MC","SAVED_PMT_DIGITS":"542523xxxx4415","SAVED_PMT_EXPDATE":"1025","SAVED_PMT_NAME":"James Mason"}";
 */

$responseJson = $_POST["hppResponse"];
try {
    // create the response object from the response JSON
    $parsedResponse = $service->parseResponse(json_encode(parseBase64Response($responseJson)));
    var_dump($parsedResponse);
    $responseCode = $parsedResponse->responseCode; // 00
    $responseMessage = $parsedResponse->responseMessage; // [ test system ] Authorised
    $responseValues = $parsedResponse->responseValues; // get values accessible by key
    // Payer Setup Details
    // $payerSetupResult = $responseValues["PAYER_SETUP"]; // 00
    // $payerSetupMessage = $responseValues["PAYER_SETUP_MSG"]; // Successful
    // $payerReference = $responseValues["SAVED_PAYER_REF"]; // 5e7e9152-2d53-466d-91bc-6d12ebc56b79
    // // Card Setup Details
    // $cardSetupResult = $responseValues["PMT_SETUP"]; // 00
    // $cardSetupMessage = $responseValues["PMT_SETUP_MSG"]; // Successful
    // $cardReference = $responseValues["SAVED_PMT_REF"]; // ca68dcac-9af2-4d65-b06c-eb54667dcd4a
    // // Card Details Stored
    // $cardType = $responseValues["SAVED_PMT_TYPE"]; // MC
    // $cardDigits = $responseValues["SAVED_PMT_DIGITS"]; // 542523xxxx4415
    // $cardExpiry = $responseValues["SAVED_PMT_EXPDATE"]; // 1025
    // $cardName = $responseValues["SAVED_PMT_NAME"]; // James Mason

    // $db->create(array(
    //   'id' => 'user1',
    //   // 'cardType' => $cardType,
    //   // 'cardDigits' => $cardDigits,
    //   // 'cardExpiry' => $cardExpiry,
    //   // 'cardName' => $cardName,
    //   // 'cardReference' => $cardReference,
    //   // 'payerReference' => $payerReference
    // ));

    // var_dump(array(
    //   'title' => 'Lorem ipsum',
    //   'cardType' => $cardType,
    //   'cardDigits' => $cardDigits,
    //   'cardExpiry' => $cardExpiry,
    //   'cardName' => $cardName,
    //   'cardReference' => $cardReference,
    //   'payerReference' => $payerReference
    // ));
    // TODO: update your application and display transaction outcome to the customer
} catch (ApiException $e) {
    // For example if the SHA1HASH doesn't match what is expected
    // TODO: add your error handling here
    var_dump($e);
    var_dump($responseJson);
}

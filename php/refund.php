<?php
require_once('vendor/autoload.php');

use GlobalPayments\Api\ServicesConfig;
use GlobalPayments\Api\ServicesContainer;
use GlobalPayments\Api\Entities\Exceptions\ApiException;
use GlobalPayments\Api\PaymentMethods\CreditCardData;

$config = new ServicesConfig();
$config->merchantId = "Quantatest";
$config->accountId = "internet";
$config->sharedSecret = "secret";
$config->refundPassword = "refund";
$config->serviceUrl = "https://api.sandbox.realexpayments.com/epage-remote.cgi";
ServicesContainer::configure($config);

// create the card object, security code not required for Refunds
$card = new CreditCardData();
$card->number = "4263970000005262";
$card->expMonth = 12;
$card->expYear = 2025;
$card->cardHolderName = "James Mason";

try {
    // process a refund to the card
    $response = $card->refund(19.99)
            ->withCurrency("EUR")
            ->execute();

    // get the response details to update the DB
    $result = $response->responseCode; // 00 == Success
    $message = $response->responseMessage; // [ test system ] AUTHORISED
} catch (ApiException $e) {
    // TODO: Add your error handling here
}
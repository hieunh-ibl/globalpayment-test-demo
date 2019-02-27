<?php
  require_once('vendor/autoload.php');

  header("Access-Control-Allow-Origin: *");

  use GlobalPayments\Api\ServicesConfig;
  use GlobalPayments\Api\HostedPaymentConfig;
  use GlobalPayments\Api\Services\HostedService;
  use GlobalPayments\Api\Entities\HostedPaymentData;
  use GlobalPayments\Api\Entities\Enums\HppVersion;
  use GlobalPayments\Api\Entities\Exceptions\ApiException;
  
  $db = new \MicroDB\Database('data/posts');

  $config = new ServicesConfig();
  $config->merchantId = "quantatest";
  $config->accountId = "internet";
  $config->sharedSecret = "secret";
  $config->serviceUrl = "https://pay.sandbox.realexpayments.com/pay";
  $config->hostedPaymentConfig = new HostedPaymentConfig();
  $config->hostedPaymentConfig->version = HppVersion::VERSION_2;
  $config->hostedPaymentConfig->cardStorageEnabled = "1";
  $service = new HostedService($config);
  
  // $card = $db->find(function($post) {
  //   return ($post["id"] === "user1");
  // });
  // data to be passed to the HPP along with transaction level settings
  $hostedPaymentData = new HostedPaymentData();
  $hostedPaymentData->offerToSaveCard = true; // display the save card tick box
  $hostedPaymentData->customerExists = false;
  // if (!is_null($card) && sizeof($card) != 0) {
  //   $hostedPaymentData->customerExists = true;
  //   $hostedPaymentData->customerKey = $card[0]["cardReference"];
  // } else {
  //   $hostedPaymentData->customerExists = false; // new customer
  // }
  
  // supply your own references for the customer and payment method
  // $hostedPaymentData->setCustomerKey = "a7960ada-3da9-4a5b-bca5-7942085b03c6";
  // $hostedPaymentData->setPaymentKey = "48fa69fe-d785-4c27-876d-6ccba660fa2b";
  
  try {
      $hppJson = $service->charge(1)
          ->withCurrency("USD")
          ->withHostedPaymentData($hostedPaymentData)
          ->serialize();
      // TODO: pass the HPP JSON to the client-side
  } catch (ApiException $e) {
      // TODO: Add your error handling here
  }
  echo $hppJson;
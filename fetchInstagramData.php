<?php
    // constants
    define("DEFAULT_UPDATE_TIME", 15);
    define("SCHEME", "https://");
    define("HOST", "graph.instagram.com");
    define("PATH", "/me/media");

    include_once('access_token.php');

    $ref = $_SERVER['HTTP_REFERER'];
    $refData = parse_url($ref);

    if(strpos($refData['host'], DOMAIN_NAME) === false) {
      header('HTTP/1.0 403 Forbidden');
      die("Access to this page is not permitted");
    }

    $fieldsParam = "?fields=caption,id,media_type,media_url,permalink,thumbnail_url,timestamp,username,children{media_url,media_type,id,permalink}";
    $limitParam = "&limit=";
    $accessTokenParam = "&access_token=";
    $api_url = SCHEME.HOST.PATH.$fieldsParam.$limitParam.MAX_MEDIA_COUNT.$accessTokenParam.TOKEN;

    function sendResponse($file) {
        header('Content-Type: application/json');
        if (file_exists($file)) {
            echo file_get_contents($file);
        } else {
            $finalJSON = [];
            $finalJSON["data"] = [];
            
            echo json_encode($finalJSON);
        }
    }

    function fetchInstaData($api_url, $file) {
        try {
            $connection_c = curl_init(); // initializing
            curl_setopt( $connection_c, CURLOPT_URL, $api_url ); // API URL to connect
            curl_setopt( $connection_c, CURLOPT_RETURNTRANSFER, 1 ); // return the result, do not print
            curl_setopt( $connection_c, CURLOPT_TIMEOUT, 20 );
            $instaDataJSON = curl_exec( $connection_c); // connect and get json data

            // with curl you will have full option to get response code or any other details
            $responseCode  = curl_getinfo($connection_c, CURLINFO_HTTP_CODE);

            header("Content-type: application/json");
            // Based on error code if needed to change handling
            if ($responseCode == 200) {
                $instagramDataObj = json_decode($instaDataJSON);
                $obj = new stdClass();

                $obj->data = $instagramDataObj->data;

                $fileHandle = fopen($file, "w");
                fwrite($fileHandle, json_encode($obj));
                fclose($fileHandle);

                echo json_encode($obj);
            } else {
                sendResponse($file);
            }
        } catch (Exception $e) {
            sendResponse($file);
        }
    }
    
    $file = __DIR__ . DIRECTORY_SEPARATOR . "userInstagram.json";
    try {
        if (TOKEN) {
            // check file existence
            $lastModifiedTime = 0;
            if (file_exists($file)) {
                $lastModifiedTime = filemtime($file);
                $currentTime = time();
                $mins = ($currentTime - $lastModifiedTime) / 60;

                // get data when difference between last modified time is more then 15 mins
                if ($mins > DEFAULT_UPDATE_TIME) {
                    fetchInstaData($api_url, $file);
                } else {
                    header('Content-Type: application/json');
                    echo file_get_contents($file);
                }
            } else {
                fetchInstaData($api_url, $file);
            }
        } else {
            sendResponse($file);
        }

    } catch (Exception $e) {
        //TODO: understand how to add logs for below message
        // $message = 'Caught exception in checking insta data file: '.$e->getMessage();
        sendResponse($file);
    }
?>

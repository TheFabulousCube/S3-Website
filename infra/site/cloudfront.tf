resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "thefabulouscube-s3-oac"
  description                       = "Origin access for static S3 website"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_function" "site_uri_rewrite" {
  name    = "thefabulouscube-directory-structure-cf-function"
  runtime = "cloudfront-js-2.0"
  comment = "Function to rewrite the S3 url.  For instance, request for /faq/ -> /faq/index.html"
  publish = true
  code    = <<-EOT
function handler(event) {
   var request = event.request;
   var uri = request.uri;
 
   // Don't rewrite API paths
   if (uri.startsWith('/api/')) {
       return request;
   }
 
   // If the URI ends with '/', append 'index.html'
   if (uri.endsWith('/')) {
       request.uri += 'index.html';
   }
   // If the URI has no extension, append '/index.html'
   else if (!uri.includes('.')) {
       request.uri += '/index.html';
   }
 
   return request;
 }
EOT
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = false
  comment             = "Demo of hosting The Fabulous Cube Website in S#"
  default_root_object = "/index.html"
  aliases             = var.acm_certificate_arn == "" ? [] : local.site_aliases
  web_acl_id = "arn:aws:wafv2:us-east-1:739275443670:global/webacl/CreatedByCloudFront-d4ae889a/edf6d286-60f9-40b5-a860-485e9eb6e779"

  origin {
    origin_id                = "the-fabulous-cube.s3-website-us-east-1.amazonaws.com-monddswyopx"
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id       = "the-fabulous-cube.s3-website-us-east-1.amazonaws.com-monddswyopx"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.site_uri_rewrite.arn
    }
  }

  custom_error_response {
    error_code         = 403
    response_code      = 404
    response_page_path = "/error.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/error.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = var.acm_certificate_arn == "" ? null : var.acm_certificate_arn
    cloudfront_default_certificate = var.acm_certificate_arn == "" ? true : null
    ssl_support_method             = var.acm_certificate_arn == "" ? null : "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
  }
}

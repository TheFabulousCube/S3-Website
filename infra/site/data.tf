data "archive_file" "contact_lambda" {
  type        = "zip"
  source_file = "${path.module}/../../lambda/contact/app.py"
  output_path = "${path.module}/../../lambda/contact/dist/contact.zip"
}

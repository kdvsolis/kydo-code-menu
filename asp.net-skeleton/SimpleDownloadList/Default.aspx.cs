using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using Newtonsoft.Json;


namespace SimpleDownloadList
{
    public partial class _Default : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            // If logged in, bind the downloads data to the grid view
            if (Request.IsAuthenticated)
            {
                BindDownloadsData();
            }

            // If logout parameter is present, sign out and redirect to default page
            if (Request.QueryString["logout"] == "true")
            {
                System.Web.Security.FormsAuthentication.SignOut();
                Response.Redirect("Default.aspx");
            }

        }

        protected void loginButton_Click(object sender, EventArgs e)
        {
            // If both customer and password inputs are valid, check if they match with the JSON data
            if (Page.IsValid)
            {
                // Get the customer data from the JSON file using the connection string from Web.config
                string customerDataPath = Server.MapPath(System.Configuration.ConfigurationManager.ConnectionStrings["CustomerData"].ConnectionString);
                string customerDataJson = File.ReadAllText(customerDataPath);

                // Parse the JSON data into an object using Newtonsoft.Json library
                dynamic customerData = JsonConvert.DeserializeObject(customerDataJson);

                // Get the customer and password inputs from the text boxes
                string customerInput = customer.Text;
                string passwordInput = password.Text;

                // Check if the customer and password inputs match with the JSON data
                if (customerInput == customerData.customer.Value && passwordInput == customerData.password.Value)
                {
                    // If they match, sign in with forms authentication and redirect to default page
                    System.Web.Security.FormsAuthentication.RedirectFromLoginPage(customerInput, false);
                }
                else
                {
                    // If they don't match, add an error message to the validation summary
                    ValidationSummary1.Controls.Add(new LiteralControl("<li>Invalid customer or password.</li>"));
                }
            }
        }

        private void BindDownloadsData()
        {
            // Get the customer data from the JSON file using the connection string from Web.config
            string customerDataPath = Server.MapPath(System.Configuration.ConfigurationManager.ConnectionStrings["CustomerData"].ConnectionString);
            string customerDataJson = File.ReadAllText(customerDataPath);

            // Parse the JSON data into an object using Newtonsoft.Json library
            dynamic customerData = JsonConvert.DeserializeObject(customerDataJson);

            // Get the downloads array from the JSON data
            var downloads = customerData.downloads;

            // Bind the downloads array to the grid view
            downloadsGrid.DataSource = downloads;
            downloadsGrid.DataBind();
        }
    }
}
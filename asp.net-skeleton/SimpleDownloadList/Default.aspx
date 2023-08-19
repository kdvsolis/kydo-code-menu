<%@ Page Title="Home Page" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="SimpleDownloadList._Default" %>

<asp:Content ID="BodyContent" ContentPlaceHolderID="MainContent" runat="server">

    <div class="container">
    <% if (Request.IsAuthenticated) { %>
    <h1>Welcome, <%= User.Identity.Name %>!</h1>
    <% } %>
    <% else { %>
    <h1>Please log in</h1>
    <asp:ValidationSummary ID="ValidationSummary1" runat="server" CssClass="alert alert-danger" />
    <div class="form-group">
        <label for="customer">Customer</label>
        <asp:TextBox ID="customer" runat="server" CssClass="form-control"></asp:TextBox>
        <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="customer"
        ErrorMessage="Customer is required." Display="None"></asp:RequiredFieldValidator>
    </div>
    <div class="form-group">
        <label for="password">Password</label>
        <asp:TextBox ID="password" runat="server" TextMode="Password" CssClass="form-control"></asp:TextBox>
        <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="password"
        ErrorMessage="Password is required." Display="None"></asp:RequiredFieldValidator>
    </div>
        <asp:Button ID="loginButton" runat="server" Text="Log In" CssClass="btn btn-primary" OnClick="loginButton_Click" />
        <% } %>

        <% if (Request.IsAuthenticated) { %>
        <h2>Your Downloads</h2>
        <asp:GridView ID="downloadsGrid" runat="server" AutoGenerateColumns="false" CssClass="table table-striped table-bordered">
            <Columns>
                <asp:TemplateField HeaderText="Title">
                    <ItemTemplate>
                        <a href='<%# Eval("downloadFileURL") %>'><%# Eval("title") %></a>
                    </ItemTemplate>
                </asp:TemplateField>
                <asp:BoundField DataField="description" HeaderText="Description" />
            </Columns>
        </asp:GridView>
        <asp:Button ID="logoutButton" runat="server" Text="Log Out" CssClass="btn btn-secondary"
        PostBackUrl="/Default.aspx?logout=true"/>
    <% } %>

    </div>

</asp:Content>

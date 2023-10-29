# Shopify API

# Application Setup

## Setup Your .env File:

- **PORT=** _input PORT number_
- **ACCESS_TOKEN=** _input access token_
- **STORE=** _input store URL_
- **API_VERSION=** _input API version_
- **DEV_DB_NAME=** _input DB name_
- **DEV_DB_HOST=** _input host name_
- **DEV_DB_USERNAME=** _input DB username_
- **DEV_DB_PASSWORD=** _input DB password_
- **APP_SECRET_KEY=** _input app key_

_Note: Do not use quotes(`'`) when typing your input fields._

# Running Application

1. **Install Dependencies:**

   - Open your terminal.
   - Run the following command to install project dependencies using yarn:
     ```
     yarn
     ```
     This command will download and install all the necessary packages specified in your `package.json` file.

2. **Compile Your TypeScript Code:**

   - After installing dependencies, compile your TypeScript application using the following command:
     ```
     yarn build
     ```
     This command will compile your TypeScript code into JavaScript, making it ready for execution.

3. **Start Your Application:**
   - Once the build process is successful, start your application using the following command:
     ```
     yarn start
     ```
     This will launch your application and make it accessible for testing and use.

Make sure to run these commands in the root directory of your project where your `package.json` file is located.

# Endpoints

## 1. Get Unfulfilled Orders

- **Local:** `localhost:PORT/order`
- **Hosted:** `{hosted_url}/order` (e.g., `https://testing-7rog.onrender.com/order`)

## 2. Update Orders

- **Local:** `localhost:PORT/update_order`
- **Hosted:** `{hosted_url}/update_order`

## 3. Get All Orders in the Database

- **Local:** `localhost:PORT/all_order`
- **Hosted:** `{hosted_url}/all_order`

# Setting Up Your Database

1. **Go to [https://neon.tech/](https://neon.tech/).**
2. **Sign Up and Log In to Your Account:**
   - Create a new account if you don't have one.
3. **Create a New Project:**
   - Click on 'Create a Project'.
   - Enter your desired project name and create the project.
4. **Enable Pooled Connection:**
   - Click on the checkbox for 'Pooled Connection'.
5. **Retrieve Database Connection Details:**
   - Click on the blur shade towrads the left-end of your link to reveal the database password.
   - Copy the entire connection link.
6. **Extract Database Details from the URL:**
   - Your database connection link will be in the format:
     `postgres://{db_username}:{db_password}@{db_host_name}/{db_name}`.
   - Replace `{db_username}`, `{db_password}`, `{db_host_name}`, and `{db_name}` with the respective values from your connection link.
7. **Paste Database Details in Your Application:**
   - Use the extracted database connection details in your application's configuration to establish a connection with the database.
8. **View and Manage Your Data:**
   - In the Neon interface, navigate to the 'Tables' section to view and manage your data.

_Note: Ensure that your database connection details are kept secure and confidential._

# Setting Up Your Hosting on Render.com

1. **Go to Render.com:**

   - Visit [Render.com](https://render.com/).

2. **Get Started For Free:**

   - Click on 'Get Started For Free' to create an account if you don't have one.

3. **Sign Up and Login:**

   - Sign up for an account and log in to your Render.com account.

4. **Create a New Web Service:**

   - Click on 'New +' on the NavBar.
   - Select 'Web Service' from the options.

5. **Build and Deploy from a Git Repository:**

   - Choose 'Build and deploy from a Git repository' and click 'Next'.

6. **Connect Your GitHub Account:**

   - Connect your GitHub account to link your repository.

7. **Connect the Repository:**

   - Click on 'Connect' on the repository you want to deploy. This will take you to the deployment setup.

8. **Deployment Setup:**

   - Input your unique name (choose any name you prefer).
   - Ensure the deployment is on the current branch.
   - In the 'Build Command' section, type:
     ```
     yarn; yarn compile;
     ```
   - In the 'Start Command' section, type:
     ```
     yarn begin
     ```
   - Click on 'Add Environmental Variable'. Input the exact keys and values from your .env file one by one.

9. **Create Web Service:**
   - After setting up the necessary configurations, click on 'Create WEB SERVICE' to deploy your application.

Your application will now be hosted on Render.com with the specified configurations. You should your url below the navbar section

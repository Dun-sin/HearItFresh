<div align="center">

![image](https://user-images.githubusercontent.com/78784850/210045371-8f386335-88cf-4a65-9d00-6ac0e808269e.png)

</div>

<h1 align="center">HearItFresh</h1>
<h2 align="center">Discover new tracks with Hear It Fresh! This user-friendly web app generates personalized Spotify playlists based on your favourite artists or a Spotify playlist link. Explore fresh music.</h2>

## 💫 Features

- Authentication of users is carried out through Spotify Login.
- Create new playlists using your favourite artists or an existing playlist
- Get better results by changing the parameters to either getting a playlist of different artists opposite to your taste or get less popular artists
- Your Spotify library will automatically receive newly added playlists.

## 👨‍💻 Usage

To use HearItFresh, simply navigate to the website and LogIn using your spotify account. Once logged in, you can create new playlists based on your favourite artists or based on a existing spotify playlist.

## 👥 Contributing

Contributions to HearItFresh are welcome! If you find a bug or have a feature request, please create an issue in the GitHub repository. If you would like to contribute code, please follow these steps:

- Take a look at the existing [Issues](https://github.com/Dun-sin/HearItFresh/issues) or [create a new issue](https://github.com/Dun-sin/HearItFresh/issues/new/choose)!
- [Fork the Repo](https://github.com/Dun-sin/HearItFresh/fork). Then, create a branch for any issue that you are working on. Finally, commit your work.
- Create a [Pull Request](https://github.com/Dun-sin/HearItFresh/compare) (PR), which will be promptly reviewed and given suggestions for improvements by the community.
- Add screenshots or screen captures to your Pull Request to help us understand the effects of the changes proposed in your PR.

Please ensure that your code follows the project's coding conventions and has adequate test coverage.

## ⚒️ Installation

- To begin, create a copy of the HearItFresh repository by forking it.Click on the <a href="https://github.com/Dun-sin/HearItFresh/fork"><img src="https://i.imgur.com/G4z1kEe.png" height="21" width="21"></a>Fork symbol at the top right corner.
- Clone your new fork of the repository in the terminal/CLI on your computer with the following command:

  ```bash
  git clone https://github.com/<your-github-username>/HearItFresh
  ```

- Navigate to the newly created HearItFresh project directory:

  ```bash
  cd HearItFresh
  ```

- Install the dependencies

   ```
   npm install && npm install -g commitizen
   ```

- Run the project

   ```
   npm run dev
   ```

## How to get the client ID and Secret ID from spotify
  - Go to [spotify for Developers](https://developer.spotify.com/)
  - Login to your spotify Account
  - Go to [your dashboard](https://developer.spotify.com/dashboard)
  - [Create a new App](https://developer.spotify.com/dashboard/create)
  - Fill in the app name `hearitfresh`, description as whatever you want, and the redirect urls to be `http://127.0.0.1:3000`, click on add and at the bottom of the page click on save
    ![developer spotify com_dashboard_a65d431fb65142beb45a5c523268c8bf](https://github.com/user-attachments/assets/6d51d1ab-0655-465a-8d8b-79f86869a65b)

  - After the project is created, go to settings and you'll find the client secret and ID to use
  - Copy them and fill them in the env file as SPOTIFY_CLIENT_ID & SPOTIFY_CLIENT_SECRET, respectively


## 🛡️ License

HearItFresh is licensed under the [MIT License](https://opensource.org/licenses/MIT).

## 🤝 Support

If you liked the project, please consider giving it a ⭐️

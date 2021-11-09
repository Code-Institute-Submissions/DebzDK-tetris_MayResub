# Tetris

This is a single page site that allows people to play yet another remake of the classic Tetris game.
The site is targeted toward people who enjoy games, like Tetris. This site will be useful for people who are interested in having a taste of nostalgia or who have never played Tetris before and stumble across this version.

## Design

### Wireframes

To kickstart the project design process, a hand-drawn wireframe was created in order to visualise this project idea.

![Hand-drawn wireframe](documentation/wireframes/hand-drawn-wireframe.jpg)

After discussing this idea during the Mentor Project Planning session, the wireframe for the chosen project idea was re-created digitally using Balsamiq.

![Wireframe for main menu](documentation/wireframes/main-menu.png)
![Wireframe for gameplay](documentation/wireframes/gameplay.png)

### Typography

[Google Fonts](https://fonts.google.com/) and [Fontspace](https://www.fontspace.com/) were used to search for and select the following fonts for this game.

'[VT323](https://fonts.google.com/specimen/VT323?query=vt)' (from Google Fonts) was used for the stats and preview areas and 'Tetris 2' (from Fontspace) was used for the game title and menu texts.

![Screenshot of selected Fontspace font](documentation/screenshots/evidence/tetris-font-selection.jpg)
![Screenshot of selected Google Fonts font](documentation/screenshots/evidence/google-font-selection.jpg)

### Colours

The site's colour scheme was chosen using [Coolers colour scheme generator](https://coolors.co/) and searching for [trending 'Tetris' colour palettes](https://coolors.co/palettes/trending/tetris).

I chose the following [colour palette](https://coolors.co/0341ae-72cb3b-ffd500-ff971c-ff3213) because it was the brightest.

![Screenshot of selected colour palette for tetris blocks](documentation/screenshots/evidence/tetris-colour-palette.jpg)

### Planning and execution

As with the previous portfolio project, Agile practices were used and documented in Trello ([planning/design board](https://trello.com/b/hGTlOqew/project-planning-design) and [dev board](https://trello.com/b/Wk8poOE2/project-development)) and [Github Projects](https://github.com/DebzDK/tetris/projects/1).

*Please note that more task details + resources are available in the Trello boards than in the Github Project page.*

Each board is divided into 3 swimlanes/columns:

* 'To Do' - used to list tasks that are yet to be done
* 'In Progress' - used to list tasks that are currently being carried out
* 'Done' - used to list completed tasks

After defining the status divisions for a task, the indicators for time constraints were defined using 't-shirt sizes'.

![Card labels screenshot from Trello](documentation/screenshots/evidence/task-sizes-and-areas.png)

‘T-shirt sizes’ were defined to provide an estimate for the perceived difficulty of a task and extra labels to further separate tasks by what part of the process they’re related to, i.e. Requirements, Design, Development, and Testing. The project area labels have been defined as follows:

* ‘Requirements’ - refers to things that are directly taken from or related to the project’s assessment criteria rather than actions derived from a requirements capture process
* 'Design' - refers to steps taken towards the appearance of the website
* 'Development' - refers to steps taken towards the implementation of the website
* 'Testing' - refers to steps taken towards validating the HTML and CSS as well as testing the responsiveness of the website

At this point, user stories were created in order to produce tasks while thinking from a user's perspective.

![Screenshot of first user story made in Trello](documentation/screenshots/evidence/first-user-story.png)

All other user stories follow the same kind of format except for where the user story is self-explanatory of the task.

*Please note that some user stories for 'Development' were not made at the time that the work was done as they should have been but have been added after the fact, using the time of relevant commits to provide a rough duration estimate.*

## Features

Each feature listed below was chosen to ultimately meet the project goal of portfolio project 2 - '...build an interactive front-end site. The site should respond to the users' actions, allowing users to actively engage with data, alter the way the site displays the information to achieve their preferred goals'.

A simple game of Tetris meets these requirements as follows:

* Responds to the users' actions by way of game controls and menu options
* Allows users to actively engage with data, i.e. playing the game
* Alters the way the site displays information through shape rotation, stats (score and level), and moving blocks through the grid

Here are the specific game features.

### Existing features

* Main menu
    * Users able to see a main menu before starting the game.

        ![GIF of main menu](documentation/screenshots/evidence/website/main-menu.gif)

        From here, a user can start the game and view game controls, credits and the leaderboard.

* Game controls
    * Users are able to use the arrow keys on their keyboard to control the movement of the Tetris blocks as follows:

        ![Screenshot of game controls](documentation/screenshots/website/controls.png)

        *For mobile gameplay, these controls will be displayed underneath the stats area.*

* Game credits
    * Users are able to see a small scrolling thank you note I included.

        ![GIF of scrolling credits](documentation/screenshots/website/credits.gif)

* Current game score counter and level indicator - 'Stats' area
    * Users are able to see their current game score and level while playing a game.

        Initially, this area contains dots as a placeholder until a game has begun.

        ![GIF of stats area changing from initial state to game state](documentation/screenshots/website/stats.gif)

* Persisting highscore table/leaderboard
    * Users are able to view highscores that persist after closing the browser, or refreshing the webpage, and returning to the game.

        Ideally, this should've been implemented in a way where scores would persist between players on different computers but that would've gone beyong this scope of this project. Instead, scores are stored locally using `localStorage`.

        ![GIF of leaderboard persisting after refreshing the page](documentation/screenshots/website/persisting-leaderboard.gif)

* Multiplier for consequtive row clearing
    * In order to stay true to Tetris, I googled 'Tetris scoring system' and chose to base my code on the description given for the '[Original Nintendo scoring system](https://tetris.wiki/Scoring#Original_Nintendo_scoring_system)' provided by [Wikipedia](https://en.wikipedia.org/wiki/Main_Page).

        ![Screenshot of Wikipedia's description for the original Nintendo scoring system for Tetris](documentation/screenshots/evidence/wikipedia-tetris-scoring-system.png)

        Resulting code:
        ```
        let level = 0;
        let currentScore = 0;
        let baseScorePerLinesCleared = [40, 100, 300, 1200];

        function incrementScore(numOfLinesCleared) {
            let baseScore = baseScorePerLinesCleared[numOfLinesCleared - 1] || baseScorePerLinesCleared[4];
            currentScore += baseScore * (level + 1);
        }
        ```

        *Note: I did not incorporate the extra points for the consequtive soft-dropping of blocks into spaces.*

* Next shape preview
    * Like in classic Tetris, there is an area where users can preview the next shape to fall which gives them a chance to strategise while playing the game.

        ![Screenshot of next shape preview](documentation/screenshots/website/next-shape-preview.png)

* Shape rotation
    * Lastly, users are able to rotate falling shapes. Tetris simply wouldn't be Tetris without it.
        To achieve this, I found and used code from a YouTube tutorial called '[Tetris, Block Movement and Rotation](https://www.youtube.com/watch?v=iAGokSQQxI8&t=1590s)'. Alternatively, I could have stored all of the versions of the tetris block rotation states and achieved the same behaviour but I wanted to learn a smarter way to do it.

        I made use of and sectioned the referenced code toward the bottom of my block.js file and modified as appropriate.

        ![GIF of shape rotation in action](documentation/screenshots/website/shape-rotation.gif)

### Future features

* Programmable controls
* Ability to choose themes
* Difficulty modes
* Stats for falling pieces

## Languages and technologies used

## Testing

### Validator testing
        
## Deployment

### Local deployment

## Credits

### Content

### Media

Purpose | Credit | Source
------------ | ------------- | -------------

## Acknowledgements

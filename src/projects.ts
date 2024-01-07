// import { marked } from "marked";

const GITHUB_BASE_URL = 'https://api.github.com/';
const USERNAME = 'jatinkumar-me';

// const projectList

export async function fetchProjectsFromGithub() {
    try {
        const url = new URL(`/users/${USERNAME}/repos`, GITHUB_BASE_URL);
        const response = await fetch(url);

        if (!response.ok) {
            console.error('Error fetching from github API');
        }

        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error has occured', error);
    }
}

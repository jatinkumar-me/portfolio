import { marked } from "marked";

type Repository = {
    name: string;
    description: string;
    stargazers_count: number;
    forks_count: number;
    url: string;
    language: string;
    topics: string[];
}

const GITHUB_BASE_URL = 'https://api.github.com/';
const USERNAME = 'jatinkumar-me';

// const projectList
async function fetchProjectsFromGithub() {
    try {
        const url = new URL(`/users/${USERNAME}/repos`, GITHUB_BASE_URL);
        const response = await fetch(url);

        if (!response.ok) {
            console.error('Error fetching from github API');
            return;
        }

        const data: Repository[] = await response.json();
        return data;
    } catch (error) {
        console.error('Error has occured', error);
    }
}

async function fetchProjectMarkup(repoURL: string) {
    try {
        const response = await fetch(`${repoURL}/readme`);

        if (!response.ok) {
            console.error('Unable to fetch markup');
            return;
        }

        const data = await response.json();

        if (!data.content) {
            console.error('Unable to get markdown');
            return;
        }

        const markup = await marked(atob(data.content));
        return markup;
    } catch (error) {
        console.error('Error fetching markup', error);
    }
}

function showProjectList(projectNames: Set<string>, repositories: Repository[]) {
    const projectSection = document.getElementById('projects');
    if (!projectSection) {
        console.error('Project section not present in DOM');
        return;
    }
    repositories.forEach((repository) => {
        if (!projectNames.has(repository.name)) {
            return;
        }
        const projectDiv = document.createElement('div');
        projectDiv.classList.add('project');
        projectDiv.innerHTML = `
            <h3 class='project-name'>${repository.name}</h3>
            <p class='project-description'>${repository.description}</p>
            <div class='project-tags'>${repository.topics.map((topic) => `<span class='tag'>${topic}</span>`).join('\n')}</div>
        `;
        projectSection.appendChild(projectDiv);
    });
}

const projectListToShow = new Set<string>([
    'blog-app',
    'calculator',
    'Discourse',
    'type-learn',
    'exploding-kittens',
    'social-book',
    'type-learn'
]);

export default async function() {
    const repositories = await fetchProjectsFromGithub();
    if (!repositories) {
        return;
    }
    console.log(repositories);
    showProjectList(projectListToShow, repositories)
}

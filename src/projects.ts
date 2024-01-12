import { marked } from "marked";
import { emojify } from "node-emoji";

type Repository = {
    name: string;
    description: string;
    stargazers_count: number;
    forks_count: number;
    url: string;
    html_url: string;
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

        let markup = await marked(atob(data.content));
        markup = markup.replace(/(:.*:)/g, (match) => emojify(match));
        return markup;
    } catch (error) {
        console.error('Error fetching markup', error);
    }
}

function showProjectList(projectNames: Map<string, string>, repositories: Repository[]) {
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
            <p><a href='${projectNames.get(repository.name)}' target='_blank'>Live link</a> • <a href='${repository.html_url}' target='_blank'>Github</a></p>
        `;

        const projectDialog = document.createElement('dialog');
        projectDialog.classList.add('project-dialog');
        projectDialog.id = `${repository.name}-dialog`;
        projectDialog.innerHTML = `
              <button autofocus id="${repository.name}-dialog-close" class="dialog-close-button">✕ Close</button>
              <div class='markup-loading' id='${repository.name}-loading'>Loading...</div>
        `
        projectSection.appendChild(projectDiv);
        projectSection.appendChild(projectDialog);

        const closeButton = document.getElementById(`${repository.name}-dialog-close`) as HTMLButtonElement;

        if (!closeButton) {
            console.warn('dialog not rendered');
            return;
        }
        projectDiv.addEventListener("click", async (event) => {
            if ((event.target as HTMLElement).tagName === 'A') {
                return;
            }
            projectDialog.showModal();
            const markup = await fetchProjectMarkup(repository.url);
            if (!markup) {
                return;
            }

            const loadingNode = document.getElementById(`${repository.name}-loading`);
            if (!loadingNode) {
                return;
            }
            loadingNode.innerHTML = markup;
        });

        closeButton.addEventListener("click", () => {
            projectDialog.close();
        });
    });
}

const projectListToShow = new Map<string, string>();
projectListToShow.set('blog-app', 'https://blog-app-jatin.netlify.app/');
projectListToShow.set('calculator', 'https://jatinkumar-me.github.io/calculator');
projectListToShow.set('Discourse', 'https://discourse-app.netlify.app/');
projectListToShow.set('type-learn', 'https://type-learn.netlify.app/');
projectListToShow.set('exploding-kittens', 'https://exploding-kittens.netlify.app/');
projectListToShow.set('type-learn', 'https://type-learn.netlify.app/');
projectListToShow.set('pinterest-clone-assignment', 'https://pinterest-clone-assignment.netlify.app/')

export default async function() {
    const repositories = await fetchProjectsFromGithub();
    if (!repositories) {
        return;
    }
    console.log(repositories);
    showProjectList(projectListToShow, repositories)
}

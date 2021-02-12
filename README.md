# craft-night-github-actions

In this workshop we want to setup a repository with an arbitrary project and perform some tasks on it using github actions. You can use github actions to build your software, to deploy an application or many other things. The trigger for these actions can be different events like a `git push` or a created pull request.

## Preperation and requirements
You will only need a github account and an editor. If you have a project hosted at github you can also use this. You do not need a paid account. Github actions is included in the free account and you can use up to 2000 action minutes per Month for free.

Please make sure you have a repository you can use or fork this one.

## Creating a simple action
We will first create an action workflow without using a template. Please create a branch `github-actions` and enable an action workflow by placing a file in the  directory `.github/workflows/`. You can choose whatever name you want, but it has to be a `.yml` file. Example: `.github/workflows/build.yml`.

A workflow can have multiple jobs and every job can execute multiple steps, which consist of multiple actions and is triggered by events. But first we will name the workflow:

```
name: Silpion Craft-Night example
```

Then we need to define on which events we want the workflow to be executed:

```
on: pull_request
```

By default this triggers the workflow, whenever a PR is created, synchonized (something is pushed into the branch) or reopened. But you can add types, if needed:

```
on:
  pull_request:
      types: [ opened, edited, synchronize, reopened ]
```

You can also define multiple events or a webhook to trigger the workflow. But we will come to that later.

Now lets define a Job and a step to test, that our setup works:

```
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: checkout
        uses: actions/checkout@v2
      - name: print something
        run: ls
```

With this snippet we defined a job called `build`, that runs on the latest ubuntu, checks out the repo and lists the files in the repository. In order to test this push the branch and create a PR. You should then see a check on your PR. Open the details and check the output. 

In order to do something useful, like executing some tests or start a build please create a project in this repository and adjust the build file to execute tests and build (if needed). To make it easy lets create an npm project with jest to execute a test:

```
npm init
```

Answer all the questions and add jest and npx as a dependency

```
npm install -s jest npx
```

Now add a test file `test.spec.js` and put a simple test there. Please write a test that fails to make the failing test visible in your PR:

```
describe('example', function() {
  it('should execute a test', function() {
    expect(true).toBe(false)
  })
})

```

Now run the test to make sure, it is executed and fails:

```
npx jest
```

The test should fail, as we expected `true` to be `false`. 

### Task 
Alter your build.yml and make sure the tests are executed in your build job. Commit and push the changes, create a PR and take a look at your build. You should find the failing test there. Then make sure, the failed test is also reflected in your PR.

## Using secrets
Everybody has secrets, rights? Sometimes we need the SSH Key to be confidential and sometimes it is an access token for a repository or some user credentials to download something we need for our application. We can store a secret in either the github organization or the repository. To store a secret in the repository open the Settings and go to Secrets. Create a new repository secret `test` and set the Value to `42`.

Now you can use this secret in your workflow file (in our case the build.yml) like this:

```
${{ test }}
```

But what, if you want to use it in a build script? You can set it as an environment variable:

```
 - name: Steup name
        env:
          super_secret: ${{ secrets.SUPERSECRET }}
```          

This environment variable will be available in the step (not the job!) you defined it for. Having a separate step to setup your environment sectes does not work!

### Task
Setup a secret and use this secret in a jest test. To access an environment variable in javascript use `process.env.<VARIABLE_NAME>`


## Build matrix
When building a product that might be used in different environments by the customer (e.g. on different JVM or Node Version) we would like to make sure, that the product we build works in for all versions, we promised the customer.

In order to execute a build for different versions of node add the following to the file:

```
...
    runs_on: ubuntu-latest
    strategy:
      matrix:
        node: [8, 10, 12]
...
``` 

Add this to the `build.yml`, commit and push this and create a PR. Take a look at your checks. There should be three builds running, for node 8, 10 and 12. 


## Scheduled events
The `schedule` event allows you to trigger a workflow at a scheduled time.

You can schedule a workflow to run at specific UTC times using [POSIX cron syntax](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/crontab.html#tag_20_25_07). 
Scheduled workflows run on the latest commit on the default or base branch. 
The shortest interval you can run scheduled workflows is once every 5 minutes.

    on:
      schedule:
        # * is a special character in YAML so you have to quote this string
        - cron:  '*/15 * * * *'

### Task
Create a nightly build event that builds the project and runs all tests using the build matrix.

**Hint:**

<!-- _You'll have to create a new workflow file (yml)._ -->

## Multiple Jobs
If you want to build, test and deploy in different phases you ca do so, by defining multiple Jobs. But you usually don't want to deploy, if the build or test job fails. You can implement this by defining, that your job `needs` another job:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: checkout
        uses: actions/checkout@v2
      - name: run tests
        env:
          secret: ${{ secrets.SOME_SECRET }}
        run: npm build
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [ 8, 10, 12 ]
    steps:
      - name: checkout
        uses: actions/checkout@v2
      - name: run tests
        env:
          secret: ${{ secrets.SOME_SECRET }}
        run: npx jest
  deploy:
    needs: [build, test]
    runs-on: ubuntu-latest
    steps:
      - name: checkout
        uses: actions/checkout@v2
      - name: deploy
```
### Task
Use the config above:

- add it to your build.yml
- create a branch
- commit and push the change
- create a PR
- take a look at the checks and find the graphical representation of your flow.

![Image of the graphical representation of the workflow](img/flow.png)

## Artifacts
When your build is finished you might want to offer some artifacts for a download. This could be the application you just build, test results or anything else that is useful for you or your users.

```
  - uses: actions/upload-artifact@v2
    with:
      name: deploy-script
      path: deploy.sh
```

### Task
Add the code snippet to a new PR and find the deploy.sh artifact. Then update the action to upload more than one file.

## Docker
Docker is available without any additional effort.

### Task
Add a step, that build a docker image, upload this as an artifacts and download the artifact to run it locally.

*Hint*

<!-- You can export a docker image with `docker save <imageId> > filename` and import it using `docker load -i <filename>`. -->

## Caching
When application are built, we usually need quite some dependencies and we need to download them in every build. In order to save time a speed up the feedback circle we can cache our dependencies:

```
- name: Cache node modules
      uses: actions/cache@v2
      env:
        cache-name: cache-node-modules
      with:
        # npm cache files are stored in `~/.npm` on Linux/macOS
        path: ~/.npm
        key: ${{ runner.os }}-build-${{ env.cache-name }}-${{ hashFiles('**/package-lock.json') }}
        restore-keys: |
          ${{ runner.os }}-build-${{ env.cache-name }}-
          ${{ runner.os }}-build-
          ${{ runner.os }}-

```

### Task
Cache the dependencies!

## Documentation
The documentation available for Github Actions and Github in general is great. Take a look: https://docs.github.com/en/actions.

## Conclusion
Building, testing or deploying your app with Github Actions is fairly easy. The simplicity and the quality of the documentation enabled us to work with Actions without the need of hours of research. We just did it. Thats the way it should go. If course there are a few caveats. There is a free plan for Open Source projects, but you have to apply for them. 

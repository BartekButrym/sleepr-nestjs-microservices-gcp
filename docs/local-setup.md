## Lokalne uruchomienie

1. Uruchom Docker Desktop
2. W Docker Desktop uruchamiam klaster Kubernetes (zakładka Kubernetes). Upewnij się, ze jest wybrany kontekst dockera komendą:

```sh
kubectl config get-contexts
kubectl config use-context docker-desktop
kubectl cluster-info
kubectl get pods
```

3. Upewnij się, ze jesteś zalogowany do gcloud:

```sh
gcloud auth application-default login
```

## Google Cloud Console

1. Artifact Registry

W polu wyszukiwania wpisuję Artifact Registry. Tutaj tworzę repository dla kazdego serwisu:
Name: reservation
Format: Docker
Mode: standard
Location type: Region
Region: dowolny

Powtórz powysze kroki dla: auth, notifications i payments.

2. gcloud CLI
   Będąc w Artifact Registry zaznaczam jeden z serwisów i w prawym górnym rogu klikam na "Instrukcje konfiguracji".
   Stąd klikam w link, który przenosi mnie do przewodnika instalacji SDK Google Cloud.

W terminalu wpisuję:

```sh
gcloud config configurations create sleepr
```

W konsoli google cloud kopiuję id projektu: `sleepr-478116`, i następnie w terminalu:

```sh
gcloud config set project sleepr-478116
```

W następnym kroku dodaję domyślne uwierzytelnianie dla gcloud. W terminalu:

```sh
gcloud auth application-default login
```

to otwrozy okno do zalogowania się w przeglądarce. Dzięki temu mogę w terminalu sprawdzić jakie utworzyłem repozytoria na Google Cloud:

```sh
gcloud artifacts repositories list
```

Następnie, konfiguruję Docker i gcloud jako asystenta danych logowania w Artifact Registry. W Artifact Registry zaznaczam repozytorium i klikam na "Instrukcje konfiguracji" i tam kopiuję komendę:

```sh
gcloud auth configure-docker \
    europe-central2-docker.pkg.dev
```

Przechodzę do folderu `apps/reservations` i buduję obrazk dockera:

```sh
 docker build -t reservations -f ./Dockerfile ../../
```

Następnie, w Artifact Registry klikam w repozytorium `reservations` i klikam na przycisk "Kopiuj ściezkę". W terminalu wpisuję:

```sh
docker tag reservations europe-central2-docker.pkg.dev/sleepr-478116/reservations/production
```

W kolejnym kroku:

```sh
docker image push europe-central2-docker.pkg.dev/sleepr-478116/reservations/production
```

Powtarzam powyzsze kroki dla pozostałych repozytoriów: auth, notifications i payments.

W terminalu wprowadzam komendę, zeby wymusić przebudowę wszystkich kontenerów lokalnie:

```sh
docker compose up --build
```

## Automatyzacja budowania i wdrazania obrazów Docker

Budowanie obrazów staje się uciążliwe na tym etapie, ponieważ trzeba ciągle ręcznie budować, tagować i przesyłać każdy z obrazów.
Zamiast tego można użyć gcloud do skonfigurowania CI/CD i w pełni zautomatyzować proces budowania i wdrażania, dzięki czemu nowe obrazy będą tworzone za każdym razem, gdy przesyłam commit do repozytorium.

Można to zrobić za pomocą Google Cloud Build, co pozwoli zdefiniować plik konfiguracyjny, w którym można wymienić wszystkie kroki wymagane do zbudowania i przesłania obrazów Dockera.

Do tego celu utworzony jest plik `/cloudbuild.yaml`. Tam znajduje się konfiguracja z krokami potrzebnymi do zbudowania i wypchania obrazów Docker.

NastĻeni przechodzę do Google Cloud Console i wyszukuję Cloud Build. Włączam tą usługę (Enable).
Dalej, klikam na `Set up build trigger`, który ustawi automatyczny build, gdy wykryje push na GitHub.
To tez automatycznie rozpocznie budowanie nowych obrazów Docker za kazdym razem gdy zrobię push na GitHub.

## Uruchamianie własnego lokalnego klastra Kubernetes i uruchamianie lokalnie obrazów Docker

Komenda do sprawdzania pods: `kubectl get pods`.

W następnym kroku utworzę deployment. Uzywam `Helm` jako menedzer zalezności dla Kubernetesa, dzięki czemu mogę zrobić deploy aplikacji gdziekolwiek - lokalnie lub na gcloud.

Deployment'y są utworzone w katalogu `/k8s`.

W terminalu przechodzę do folderu `/k8s/sleepr` i uruchamiam komendę:

```sh
helm install sleepr .
```

Jeśli chcę zaktualizować pody:

```sh
helm upgrade sleepr .
```

A gdy chcę usunąć:

```sh
helm uninstall sleepr
```

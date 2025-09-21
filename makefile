seed_university_data:
	docker build -t seed-university-data ./seed \
	&& docker run --rm --name seed-university-data \
	-v ./:/app/output \
	-e TOTAL_FACULTIES=10 \
	-e TOTAL_STUDENTS=20000 \
	-e REGISTRATION_SEMESTER=2 \
	seed-university-data

university_db:
	docker compose up -d db

down:
	docker compose down
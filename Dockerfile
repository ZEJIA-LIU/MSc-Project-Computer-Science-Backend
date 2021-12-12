FROM ubuntu:16.04
RUN apt-get update \
	&& apt-get install gcc -y \
	&& apt-get install g++ -y \
	&& apt-get install openjdk-8-jdk -y \
	&& apt-get install python2.7 -y \
    && apt-get install python3 -y \
	&& apt-get install nodejs -y \
	&& apt-get install time -y
ENV LANG C.UTF-8

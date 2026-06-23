# CLAUDE.md

# Project Overview

## Project Name

Petlog

## Project Description

Petlog는 반려동물 보호자가 반려동물의 건강 데이터를 기록하고 관리하며,
AI 기반 분석을 통해 건강 변화를 이해할 수 있도록 돕는 모바일 우선 웹 서비스이다.

상용화를 목표로 하는 실제 제품이며, 동시에 풀스택 / 프로덕트 엔지니어 이직용 포트폴리오이다.

상용화까지의 전 과정(문제 정의 → 설계 → 개발 → 출시 → 사용자 반응)을 포트폴리오로 활용한다.

목표: 실제 사용자가 쓰는 서비스를 만든다. 실사용자 확보가 곧 성공이다.


# Product Vision

## User Problem

반려동물 보호자는 다음 문제를 경험한다.

- 병원 기록과 건강 정보가 여러 곳에 흩어져 있다.
- 반려동물의 작은 건강 변화를 알아차리기 어렵다.
- 병원 방문 후 설명 내용을 기억하기 어렵다.
- 장기적인 건강 기록 관리가 어렵다.


## Solution

Petlog는 다음 가치를 제공한다.

- 반려동물 건강 기록 관리
- 건강 변화 흐름 확인
- AI 기반 건강 리포트 (핵심 차별화 기능)
- 보호자가 이해하기 쉬운 정보 제공
- 정기 건강 알림으로 지속적인 기록 유도


# Product Positioning

Petlog는 의료 진단 서비스가 아니다.

## 제공하지 않는 것

- 질병 진단
- 의료 판단
- 수의사 대체

## 제공하는 것

- 건강 데이터 기록
- 변화 확인
- 보호자의 의사결정 지원
- AI 기반 건강 요약 리포트 (유료)


## 리텐션 전략

사용자가 앱을 주기적으로 열 이유를 만든다.

- 정기 건강 체크 알림 ("이번 주 기록을 남겨보세요")
- 백신 / 투약 만료 알림
- 주간 건강 요약 푸시


# Engineering Goal

이 프로젝트의 목표는 단순히 동작하는 앱을 만드는 것이 아니다.

실제 서비스를 개발하는 프로덕트 엔지니어 관점으로:

- 유지보수 가능한 구조
- 확장 가능한 설계
- 명확한 데이터 흐름
- 사용자 중심 UX

를 우선한다.


# Tech Stack

## Frontend

- React
- TypeScript
- Next.js
- Mobile-first Responsive UI

## Backend

- NestJS
- TypeScript

## Database

- PostgreSQL

## AI

현재:

- Mock AI Service (초기 개발용)

향후 (상용화 단계):

- OpenAI Fine-tuned 모델 연동
- 반려동물 건강 데이터 기반 학습 데이터 구축
- AI 리포트가 핵심 차별화 기능

AI 기능은 교체 가능한 구조로 설계한다.
Mock → Fine-tuned 모델 전환 시 비즈니스 로직 변경 없이 Provider만 교체한다.


# Architecture Principles

## Domain First

화면이나 기술 기준이 아니라 비즈니스 도메인 기준으로 설계한다.

예:

User
 └── Pet
      ├── HealthRecord
      ├── MedicalEvent
      ├── Medication
      └── Report


## Separation of Concerns

책임을 명확히 분리한다.

분리 대상:

- UI Layer
- Business Logic
- Data Access
- External Service
- AI Service

비즈니스 로직을 다음 위치에 작성하지 않는다.

- React Component
- Controller
- API Handler


# Frontend Architecture

## Feature Based Structure

기술 계층보다 기능/도메인 중심 구조를 선호한다.

예:

src/
 ├ features/
 │   ├ pet/
 │   ├ health-record/
 │   ├ report/
 │   └ auth/
 ├ shared/
 ├ components/
 ├ hooks/
 └ utils/


## Component Principle

컴포넌트는 하나의 책임을 가진다.

좋은 컴포넌트:

- 명확한 역할
- 예측 가능한 Props
- 재사용 가능
- 테스트 가능

피한다:

- 하나의 컴포넌트에 API 호출
- 상태 관리
- 비즈니스 로직
- UI 렌더링 혼합


# State Management

상태는 목적에 따라 관리한다.

## Local State

UI 상태:

- Modal
- Input
- Toggle

## Server State

API 데이터:

- Pet 정보
- Health Record
- Report

## Global State

정말 필요한 상태만 관리한다.

전역 상태 남용 금지.


# Data Flow

데이터 흐름은 단방향을 유지한다.

API
↓
Data Layer
↓
Feature Logic
↓
Component

Component에서 직접 여러 API를 호출하지 않는다.


# TypeScript Rules

TypeScript는 문서 역할을 한다.

선호:

- 명확한 Type
- Domain Type
- Interface
- Enum

금지:

any

타입 오류를 숨기지 않는다.


# API Integration

API 호출 로직은 UI와 분리한다.

예:

features/pet/
- api/
- hooks/
- types/
- components/

Component 내부에서 직접 fetch 하지 않는다.


# Backend Principles

## NestJS Module

도메인 기준으로 구성한다.

예:

src/
- auth
- user
- pet
- health-record
- report

## Controller

Controller는 얇게 유지한다.

책임:

- Request 처리
- Validation
- Response 반환

Business Logic은 Service Layer에서 관리한다.


# AI Architecture

AI 호출은 비즈니스 로직과 직접 연결하지 않는다.

추상화를 유지한다.

구조:

HealthReportGenerator
↓
MockHealthReportGenerator
↓
LLMHealthReportGenerator

목표:

- 초기 Mock 개발 가능
- 실제 AI Provider 교체 가능
- 테스트 가능한 구조


# Database Principles

PostgreSQL을 Source of Truth로 사용한다.

설계 시 고려:

- 데이터 관계
- 조회 패턴
- 확장 가능성
- 인덱스

초기에는 최적화보다 올바른 도메인 모델링을 우선한다.


# UX Principles

Petlog는 모바일 우선 서비스다.

중요 기준:

- 빠른 기록
- 적은 입력
- 명확한 정보 표현

모든 비동기 상태를 고려한다.

- Loading
- Success
- Empty
- Error


# Performance Principles

최적화는 측정 기반으로 한다.

고려:

- 불필요한 렌더링
- 이미지 최적화
- 캐싱
- 번들 크기
- Lazy Loading


# Error Handling

실패 경험도 제품 경험으로 생각한다.

처리 대상:

- API 실패
- 네트워크 오류
- 이미지 업로드 실패
- AI 생성 실패

사용자가 다음 행동을 알 수 있어야 한다.


# Testing Principles

테스트 우선순위:

1. 핵심 비즈니스 로직
2. 데이터 변환 로직
3. 사용자 핵심 흐름

단순 UI 테스트보다 실제 동작 검증을 우선한다.


# Development Priority

개발 순서:

1. Domain Model
2. PostgreSQL Schema
3. NestJS API
4. Frontend User Flow
5. Health Timeline
6. Mock AI Report (구조 검증용)
7. Deployment (Vercel + Railway)
8. Real AI Integration (OpenAI Fine-tuned Model)

기능 추가보다 핵심 사용자 흐름 완성을 우선한다.

AI 연동은 후반부이지만, 데이터 모델은 처음부터 AI가 소비할 구조로 설계한다.


# Portfolio Perspective

최종 결과물은 다음 질문에 답할 수 있어야 한다.

- 왜 이 서비스를 만들었는가?
- 어떤 사용자 문제를 해결하는가?
- 왜 이런 구조를 선택했는가?
- 어떤 기술적 문제를 해결했는가?
- 실제 서비스로 어떻게 확장 가능한가?


# Decision Making Rule

기술 선택 기준:

1. 사용자 가치
2. 제품 완성도
3. 유지보수성
4. 확장 가능성
5. 기술적 흥미

새로운 기술 적용 자체가 목적이 아니다.

제품 문제를 해결하는 것이 목적이다.


## 응답 언어

코드·설명 모두 **한글**로 응답한다.


## 꼬리질문 규칙

작업 완료 후 또는 계획 수립 후에는 반드시 다음 형식으로 꼬리질문 3개를 제시한다.

적용 상황 (아래 중 하나 이상에 해당하는 큰 작업):
- 새로운 기능 또는 모듈을 구현했을 때
- 아키텍처 또는 설계 계획을 제안했을 때
- 여러 파일에 걸친 리팩토링을 마쳤을 때
- 데이터 모델 또는 API 구조를 변경했을 때

제외 상황 (꼬리질문 생략):
- 오타 수정, 변수명 변경, 주석 수정 등 단순 수정
- 단일 파일의 사소한 스타일 변경
- 질문에 대한 설명 또는 코드 해석만 했을 때

형식:

---

**추가로 고려할 점이 있습니다.**

1. [우려 또는 고려사항 질문]
2. [우려 또는 고려사항 질문]
3. [우려 또는 고려사항 질문]

---

질문 기준:
- 아키텍처 관점: 기존 구조와 충돌 여부, 도메인 경계 준수 여부
- 확장성 관점: 향후 기능 추가 시 걸림돌 여부
- 제품 관점: 사용자 경험 영향, Edge Case 처리 여부
- 운영 관점: 배포 리스크, 성능 또는 데이터 정합성 문제

이미 처리된 내용은 다시 묻지 않는다. 현재 작업에서 놓쳤을 수 있는 구체적인 문제를 질문한다.

세부 가이드: `.claude/docs/interaction-style.md`
